import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, DatePipe, DecimalPipe} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {provideNativeDateAdapter} from '@angular/material/core';

import {debounceTime, distinctUntilChanged, filter, switchMap, startWith} from 'rxjs/operators';
import {Observable} from 'rxjs';

import {
  AgeClass,
  BirdStatus,
  DataEntry,
  Direction,
  HandWingMoult,
  MuscleClass,
  Sex,
  SmallFeatherAppMoult,
  SmallFeatherIntMoult,
  SelectOption
} from '../models/data-entry.model';
import {ApiService} from '../service/api.service';
import {Species} from '../models/species.model';

@Component({
  selector: 'app-data-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  providers: [provideNativeDateAdapter(), DatePipe, DecimalPipe],
  templateUrl: './data-entry-form.html',
  styleUrls: ['./data-entry-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataEntryFormComponent implements OnInit {
  // Services and Router
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);

  // Element References for focus management
  @ViewChild('ringNumberInput') ringNumberInput!: ElementRef<HTMLInputElement>;
  @ViewChild('netLocationInput') netLocationInput!: ElementRef<HTMLInputElement>;

  // Component State
  private readonly entryId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => !!this.entryId());
  readonly loading = signal<boolean>(false);

  // Species Autocomplete
  filteredSpecies!: Observable<Species[]>;

  // Form Definition
  entryForm = this.fb.group({
    ringing_station: ['ILLMITZ', Validators.required],
    staff: [null as number | null, Validators.required], // Assuming user ID is a number
    date_time: [this.getInitialDateTime(), Validators.required],
    species: ['', Validators.required],
    bird_status: [BirdStatus.FirstCatch, Validators.required],
    ring_number: ['', Validators.required],
    net_location: [null as number | null, Validators.required],
    net_height: [null as number | null, Validators.required],
    net_direction: [Direction.Left, Validators.required],
    fat_deposit: [null as number | null, [Validators.min(0), Validators.max(8)]],
    muscle_class: [null as MuscleClass | null],
    age_class: [AgeClass.Unknown, Validators.required],
    sex: [Sex.Unknown, Validators.required],
    small_feather_int: [null as SmallFeatherIntMoult | null],
    small_feather_app: [null as SmallFeatherAppMoult | null],
    hand_wing: [null as HandWingMoult | null],
    tarsus: [null as number | null],
    feather_span: [null as number | null],
    wing_span: [null as number | null],
    weight_gram: [null as number | null],
    notch_f2: [null as number | null],
    inner_foot: [null as number | null],
    comment: [''],
  });

  // Select Options (Enums to Array)
  birdStatusOptions: SelectOption<BirdStatus>[] = [
    {value: BirdStatus.FirstCatch, viewValue: 'Erstfang (e)'},
    {value: BirdStatus.ReCatch, viewValue: 'Wiederfang (w)'},
  ];

  // ... (add other enum options similarly) ...

  constructor() {
    // Effect to load data in edit mode
    effect(() => {
      const id = this.entryId();
      if (id) {
        this.loading.set(true);
        this.apiService.getDataEntry(id).subscribe(entry => {
          this.entryForm.patchValue(this.transformToForm(entry));
          this.loading.set(false);
        });
      }
    });
  }

  ngOnInit(): void {
    this.filteredSpecies = this.entryForm.get('species')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter(value => typeof value === 'string'),
      switchMap(name => this.apiService.getSpecies(name))
    );
  }

  // Handle Autocomplete Display
  displaySpecies(species: Species): string {
    return species ? species.common_name_de : '';
  }

  // Ubiquitous Input Logic
  onBirdStatusChange(value: BirdStatus): void {
    if (value) {
      this.ringNumberInput.nativeElement.focus();
    }
  }

  onNetDirectionChange(value: Direction): void {
    if (value) {
      // Assuming next logical field is fat_deposit
      const fatDepositEl = document.querySelector<HTMLInputElement>('[formControlName="fat_deposit"]');
      fatDepositEl?.focus();
    }
  }

  onSubmit(): void {
    if (this.entryForm.invalid) {
      return;
    }

    this.loading.set(true);
    const formValue = this.transformFromForm(this.entryForm.getRawValue());

    const saveOperation = this.isEditMode()
      ? this.apiService.updateDataEntry(this.entryId()!, formValue)
      : this.apiService.createDataEntry(formValue);

    saveOperation.subscribe({
      next: () => this.router.navigate(['/data-entries']), // Navigate to list view on success
      error: (err) => {
        console.error('Error saving data entry', err);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  private getInitialDateTime(): string {
    const now = new Date();
    now.setMinutes(0, 0, 0); // Set to the last full hour
    // Format to 'yyyy-MM-ddTHH:mm' which is expected by datetime-local input
    return this.datePipe.transform(now, 'yyyy-MM-ddTHH:mm')!;
  }

  // Data Transformation for Form Patching
  private transformToForm(entry: DataEntry): any {
    // The API might return related objects; we need to extract IDs for the form
    const formValue = {...entry} as any;
    formValue.species = entry.species; // Assume the backend gives you the object or ID.
    formValue.ring_number = (entry.ring as any)?.number; // Adjust based on API response
    // Ensure date is in a format the form control can use
    formValue.date_time = this.datePipe.transform(entry.date_time, 'yyyy-MM-ddTHH:mm');
    return formValue;
  }

  // Data Transformation for API Submission
  private transformFromForm(formValue: any): Partial<DataEntry> {
    const payload = {...formValue};
    // The species control holds the full object, extract the ID
    payload.species = formValue.species?.id;
    return payload;
  }
}
