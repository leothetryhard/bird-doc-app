import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import {MatSelect, MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {provideNativeDateAdapter} from '@angular/material/core';

import {debounceTime, distinctUntilChanged, switchMap, startWith, map, catchError} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

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
  SelectOption, FatClass
} from '../models/data-entry.model';
import {ApiService} from '../service/api.service';
import {Species} from '../models/species.model';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {RingingStation} from '../models/ringing-station.model';
import {Scientist} from '../models/scientist.model';
import {RingSize} from '../models/ring.model';

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
    RouterLink,
    MatCheckboxModule
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
  // Component State
  private readonly entryId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => !!this.entryId());
  readonly loading = signal<boolean>(false);

  // Species Autocomplete
  filteredSpecies!: Observable<Species[]>;
  filteredStations!: Observable<RingingStation[]>;
  filteredScientists!: Observable<Scientist[]>;

  // Form Definition
  entryForm = this.fb.group({
    organization: ['AUW', Validators.required],
    ringing_station: [null as RingingStation | null, Validators.required],
    staff: [null as Scientist | null, Validators.required],
    date_time: [this.getInitialDateTime(), Validators.required],
    species: ['', Validators.required],
    bird_status: [BirdStatus.FirstCatch, Validators.required],
    ring_size: [RingSize.Medium, Validators.required],
    ring_number: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    net_location: [null as number | null, Validators.required],
    net_height: [null as number | null],
    net_direction: [null as number | null],
    fat_deposit: [null as number | null],
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
    comment: [null as string | null],
    has_mites: [false, Validators.required],
    has_hunger_stripes: [false, Validators.required],
    has_brood_patch: [false, Validators.required],
    has_cpl_plus: [false, Validators.required],
  });

  private readonly focusOrder: string[] = [
    'ringing_station', 'staff', 'date_time', 'species', 'bird_status', 'ring_size', 'ring_number',
    'net_location', 'net_height', 'net_direction', 'age_class', 'sex', 'fat_deposit', 'muscle_class',
    'small_feather_int', 'small_feather_app', 'hand_wing',
    'tarsus', 'feather_span', 'wing_span', 'weight_gram', 'notch_f2',
    'inner_foot', 'has_mites', 'comment'
  ];

  birdStatusOptions: SelectOption<BirdStatus>[] = [
    {value: BirdStatus.FirstCatch, viewValue: 'Erstfang (e)', key: 'e'},
    {value: BirdStatus.ReCatch, viewValue: 'Wiederfang (w)', key: 'w'},
  ];

  directionOptions: SelectOption<Direction | null>[] = [
    {value: null, viewValue: '---'},
    {value: Direction.Left, viewValue: 'Links (l)', key: 'l'},
    {value: Direction.Right, viewValue: 'Rechts (r)', key: 'r'},
  ];

  muscleClassOptions: SelectOption<MuscleClass | null>[] = [
    {value: null, viewValue: '---'},
    {value: MuscleClass.Null, viewValue: '0 - Kiel nicht fühlbar', key: '0'},
    {value: MuscleClass.One, viewValue: '1 - Kiel gut fühlbar', key: '1'},
    {value: MuscleClass.Two, viewValue: '2 - Kiel kaum fühlbar', key: '2'},
    {value: MuscleClass.Three, viewValue: '3 - Kiel nicht fühlbar (konvex)', key: '3'},
  ];

  ageClassOptions: SelectOption<AgeClass>[] = [
    {value: AgeClass.Nest, viewValue: '1 - Nestling', key: '1'},
    {value: AgeClass.Unknown, viewValue: '2 - Fängling (unbekannt)', key: '2'},
    {value: AgeClass.ThisYear, viewValue: '3 - Diesjährig', key: '3'},
    {value: AgeClass.NotThisYear, viewValue: '4 - Nicht Diesjährig', key: '4'},
    {value: AgeClass.LastYear, viewValue: '5 - Vorjährig', key: '5'},
    {value: AgeClass.NotLastYear, viewValue: '6 - Nicht Vorjährig', key: '6'},
  ];

  sexOptions: SelectOption<Sex>[] = [
    {value: Sex.Unknown, viewValue: '0 - Unbekannt', key: '0'},
    {value: Sex.Male, viewValue: '1 - Männlich', key: '1'},
    {value: Sex.Female, viewValue: '2 - Weiblich', key: '2'},
  ];

  smallFeatherIntOptions: SelectOption<SmallFeatherIntMoult | null>[] = [
    {value: null, viewValue: '---'},
    {value: SmallFeatherIntMoult.None, viewValue: '0 - keine', key: '0'},
    {value: SmallFeatherIntMoult.Some, viewValue: '1 - bis zu 20 Federn', key: '1'},
    {value: SmallFeatherIntMoult.Many, viewValue: '2 - mehr als 20 Federn', key: '2'},
  ];

  smallFeatherAppOptions: SelectOption<SmallFeatherAppMoult | null>[] = [
    {value: null, viewValue: '---'},
    {value: SmallFeatherAppMoult.Juvenile, viewValue: 'J - Eben flügger Jungvogel', key: 'j'},
    {value: SmallFeatherAppMoult.Unmoulted, viewValue: 'U - Weniger als 1/3 erneuert', key: 'u'},
    {value: SmallFeatherAppMoult.Mixed, viewValue: 'M - Zwischen 1/3 und 2/3 erneuert', key: 'm'},
    {value: SmallFeatherAppMoult.New, viewValue: 'N - Mehr als 2/3 erneuert', key: 'n'},
  ];

  handWingMoultOptions: SelectOption<HandWingMoult | null>[] = [
    {value: null, viewValue: '---'},
    {value: HandWingMoult.None, viewValue: '0 - Keine Handschwingen wachsen', key: '0'},
    {value: HandWingMoult.NoneOld, viewValue: '1 - Alle sind unvermausert', key: '1'},
    {value: HandWingMoult.AtLeastOne, viewValue: '2 - Mindestens eine mausert', key: '2'},
    {value: HandWingMoult.All, viewValue: '3 - Alle vermausert', key: '3'},
    {value: HandWingMoult.Part, viewValue: '4 - Ein Teil ist vermausert', key: '4'},
  ];

  fatClassOptions: SelectOption<FatClass | null>[] = [
    {value: null, viewValue: '---'},
    {value: FatClass.Null, viewValue: '0', key: '0'},
    {value: FatClass.One, viewValue: '1', key: '1'},
    {value: FatClass.Two, viewValue: '2', key: '2'},
    {value: FatClass.Three, viewValue: '3', key: '3'},
    {value: FatClass.Four, viewValue: '4', key: '4'},
    {value: FatClass.Five, viewValue: '5', key: '5'},
    {value: FatClass.Six, viewValue: '6', key: '6'},
    {value: FatClass.Seven, viewValue: '7', key: '7'},
    {value: FatClass.Eight, viewValue: '8', key: '8'},
  ];

  ringSizeOptions: SelectOption<RingSize>[] = [
    { value: RingSize.XSmall, viewValue: 'V (Extra Small)', key: 'v' },
    { value: RingSize.Small, viewValue: 'T (Small)', key: 't' },
    { value: RingSize.Medium, viewValue: 'S (Medium)', key: 's' },
    { value: RingSize.Large, viewValue: 'X (Large)', key: 'x' },
    { value: RingSize.XLarge, viewValue: 'P (Extra Large)', key: 'p' },
  ];

  constructor() {
    effect(() => {
      const id = this.entryId();
      console.log('Edit Effect', id);
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
      map(value => (typeof value === 'string' ? value : '')),
      distinctUntilChanged(),
      switchMap(name =>
        this.apiService.getSpecies(name || '').pipe(
          map(response => response.results),
          catchError(() => {
            return of([]);
          })
        )
      )
    );
    this.filteredStations = this.entryForm.get('ringing_station')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => (typeof value === 'string' ? value : value?.name ?? '')),
      distinctUntilChanged(),
      switchMap(name =>
        this.apiService.getRingingStations(name || '').pipe(
          map(response => response.results),
          catchError(() => of([]))
        )
      )
    );

    this.filteredScientists = this.entryForm.get('staff')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => (typeof value === 'string' ? value : value?.full_name ?? '')),
      distinctUntilChanged(),
      switchMap(name =>
        this.apiService.getScientists(name || '').pipe(
          map(response => response.results),
          catchError(() => of([]))
        )
      )
    );
  }

  displaySpecies(species: Species): string {
    return species ? species.common_name_de : '';
  }

  displayStation(station: RingingStation): string {
    return station ? station.name : '';
  }

  displayScientist(scientist: Scientist): string {
    return scientist ? `${scientist.full_name} (${scientist.handle})` : '';
  }

  onSubmit(): void {
    if (this.entryForm.invalid) {
      return;
    }

    this.loading.set(true);
    const formValue = this.transformFromForm(this.entryForm.getRawValue());
    console.log(formValue);

    const saveOperation = this.isEditMode()
      ? this.apiService.updateDataEntry(this.entryId()!, formValue)
      : this.apiService.createDataEntry(formValue);

    saveOperation.subscribe({
      next: () => this.router.navigate(['/data-entries']),
      error: (err) => {
        console.error('Error saving data entry', err);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  private getInitialDateTime(): string {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return this.datePipe.transform(now, 'yyyy-MM-ddTHH:mm')!;
  }

  private transformToForm(entry: DataEntry): any {
    const formValue = {...entry} as any;
    formValue.species = entry.species;
    if (entry.ring) {
      formValue.ring_size = entry.ring.size;
      formValue.ring_number = entry.ring.number;
    }
    formValue.date_time = this.datePipe.transform(entry.date_time, 'yyyy-MM-ddTHH:mm');
    return formValue;
  }

  private transformFromForm(formValue: any): Partial<DataEntry> {
    const payload = {...formValue};
    payload.species_id = formValue.species?.id;
    payload.species = formValue.species?.id;
    payload.ringing_station_id = formValue.ringing_station?.handle;
    payload.staff_id = formValue.staff?.id;
    delete payload.species;
    delete payload.ringing_station;
    delete payload.staff;
    return payload;
  }

  onSelectKeydown(
    event: KeyboardEvent,
    controlName: string,
    options: SelectOption<any>[],
    // Add this parameter to accept the component reference
    selectComponent: MatSelect
  ): void {
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();
    const matchingOption = options.find(opt => opt.key === key);

    if (matchingOption) {
      event.preventDefault();
      this.entryForm.get(controlName)?.setValue(matchingOption.value);

      // ADD THIS LINE to close the dropdown panel
      selectComponent.close();

      this.focusNext(controlName);
    }
  }

  /**
   * Moves focus to the next element in the defined focus order.
   */
  private focusNext(currentControlName: string): void {
    const currentIndex = this.focusOrder.indexOf(currentControlName);
    if (currentIndex > -1 && currentIndex < this.focusOrder.length - 1) {
      const nextControlName = this.focusOrder[currentIndex + 1];
      setTimeout(() => {
        const nextEl = document.querySelector(`[formControlName="${nextControlName}"]`) as HTMLElement;
        nextEl?.focus();
      }, 50);
    }
  }
}
