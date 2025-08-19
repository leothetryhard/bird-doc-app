import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {Observable, of, Subject} from 'rxjs';
import { startWith, debounceTime, distinctUntilChanged, switchMap, map, takeUntil, filter, tap } from 'rxjs/operators';
import {DataEntryService} from '../service/data-entry';
import {BirdStatus, DataEntry, NetHeight, Species} from '../models/data-entry.model';
import {AsyncPipe} from '@angular/common';


@Component({
  selector: 'app-data-entry-form',
  imports: [
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    RouterLink,
    AsyncPipe,
  ],
  templateUrl: './data-entry-form.html',
  styleUrls: ['./data-entry-form.scss']
})
export class DataEntryFormComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dataEntryService = inject(DataEntryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChildren('formInput') formInputs!: QueryList<ElementRef>;

  public entryForm!: FormGroup;
  public isEditMode = false;
  public entryId: number | null = null;
  public isLoading = false;

  filteredSpecies$!: Observable<Species[]>;

  birdStatusValues = Object.values(BirdStatus);
  netHeightValues = Object.values(NetHeight);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.setupSpeciesAutocomplete();
    this.checkEditMode();
    this.setupAutoSelectListeners();
  }

  ngAfterViewInit(): void {
    // Focus the first element on load
    setTimeout(() => this.formInputs.first?.nativeElement.focus(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getDefaultDateTime(): Date {
    const now = new Date();
    now.setMinutes(0, 0, 0); // Set to the last full hour
    return now;
  }

  private initializeForm(): void {
    this.entryForm = this.fb.group({
      ringing_station: [null, Validators.required],
      staff: [null, Validators.required],
      date_time:[null, Validators.required],
      species: [null, Validators.required],
      bird_status:[null, Validators.required],
      ring_number: ['', Validators.required],
      net_location: ['', Validators.required],
      net_height: [null, Validators.required],
      net_direction: [null, Validators.required],
      fat_deposit: [null],
      muscle_class: [null],
      age_class: [null],
      sex: [null],
      small_feather_int: [null],
      small_feather_app: [null],
      hand_wing: [null],
      tarsus: [null],
      feather_span: [null],
      wing_span: [null],
      weight_gram: [null],
      notch_f2: [null],
      inner_foot: [null],
      comment: ['']
    });
  }

  private setupSpeciesAutocomplete(): void {
    this.filteredSpecies$ = this.entryForm.get('species')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = typeof value === 'string'? value : (value as Species)?.german_name || '';
        if (query.length > 1) {
          return this.dataEntryService.searchSpecies(query);
        }
        return of();
      }),
      takeUntil(this.destroy$)
    );
  }

  private setupAutoSelectListeners(): void {
    // Auto-select species if only one result
    this.filteredSpecies$.pipe(
      filter(species => species.length === 1),
      tap(species => {
        this.entryForm.get('species')?.setValue(species, { emitEvent: false });
        this.focusNext('species');
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    // Placeholder for other auto-select logic (e.g., for mat-select)
    // This requires a more complex setup with custom components or directives
    // to get the filtered list from mat-select.
  }

  private checkEditMode(): void {
    this.entryId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.entryId) {
      this.isEditMode = true;
      this.isLoading = true;
      this.dataEntryService.getDataEntry(this.entryId).subscribe({
        next: (data) => {
          this.entryForm.patchValue(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load data entry', err);
          this.isLoading = false;
          // Handle error (e.g., show notification)
        }
      });
    }
  }

  displaySpecies(species: Species): string {
    return species && species.german_name? `${species.german_name} (${species.code})` : '';
  }

  onSubmit(): void {
    if (this.entryForm.invalid) {
      return;
    }
    this.isLoading = true;
    const formData = this.entryForm.value;

    // Convert species object to ID before sending
    if (formData.species && typeof formData.species === 'object') {
      formData.species = formData.species.id;
    }

    const saveOperation: Observable<DataEntry> = this.isEditMode
      ? this.dataEntryService.updateDataEntry(this.entryId!, formData)
      : this.dataEntryService.createDataEntry(formData);

    saveOperation.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/data-entries']);
      },
      error: (err) => {
        console.error('Failed to save data entry', err);
        this.isLoading = false;
        // Handle error
      }
    });
  }

  focusNext(currentControlName: string): void {
    const formControls = [
      'ringing_station', 'staff', 'date_time', 'species', 'bird_status', 'ring_number',
      'net_location', 'net_height', 'net_direction', 'fat_deposit', 'muscle_class',
      'age_class', 'sex', 'small_feather_int', 'small_feather_app', 'hand_wing',
      'tarsus', 'feather_span', 'wing_span', 'weight_gram', 'notch_f2', 'inner_foot', 'comment'
    ];

    const currentIndex = formControls.indexOf(currentControlName);
    if (currentIndex > -1 && currentIndex < formControls.length - 1) {
      const nextControlName = formControls[currentIndex + 1];
      const nextElement = document.querySelector(`[formControlName="${nextControlName}"]`);
      if (nextElement) {
        (nextElement as HTMLElement).focus();
      }
    }
  }
}
