import {Injectable, signal, computed, inject, WritableSignal, Signal} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {DataEntry, Species} from '../models/data-entry.model';
import {ApiState} from '../models/api-state.model';

@Injectable({
  providedIn: 'root'
})
export class DataEntryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/data-entries/';
  private speciesApiUrl = 'http://127.0.0.1:8000/api/species/';

  // Private writable signal for the list state
  private listState: WritableSignal<ApiState<DataEntry[]>> = signal({
    data: [],
    loading: false,
    error: null
  });

  // Public computed signals for components to consume
  public dataEntries: Signal<DataEntry[]> = computed(() => this.listState().data);
  public loading: Signal<boolean> = computed(() => this.listState().loading);
  public error: Signal<any> = computed(() => this.listState().error);

  constructor() {
  }

  // --- CRUD Operations ---

  loadDataEntries(filterParams: { [param: string]: any } = {}): void {
    this.listState.update(state => ({...state, loading: true, error: null}));

    let params = new HttpParams();
    for (const key in filterParams) {
      if (filterParams[key] !== null && filterParams[key] !== undefined && filterParams[key] !== '') {
        params = params.append(key, filterParams[key]);
      }
    }

    this.http.get<DataEntry[]>(this.apiUrl, {params}).pipe(
      tap(data => {
        this.listState.set({data: data, loading: false, error: null});
      }),
      catchError(error => {
        this.listState.set({data: [], loading: false, error});
        return throwError(() => error);
      })
    ).subscribe(); // Subscribe to trigger the request
  }

  getDataEntry(id: number): Observable<DataEntry> {
    return this.http.get<DataEntry>(`${this.apiUrl}${id}/`);
  }

  createDataEntry(entry: DataEntry): Observable<DataEntry> {
    return this.http.post<DataEntry>(this.apiUrl, entry).pipe(
      tap(() => this.loadDataEntries()) // Refresh the list after creation
    );
  }

  updateDataEntry(id: number, entry: DataEntry): Observable<DataEntry> {
    return this.http.put<DataEntry>(`${this.apiUrl}${id}/`, entry).pipe(
      tap(() => this.loadDataEntries()) // Refresh the list after update
    );
  }

  deleteDataEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`).pipe(
      tap(() => this.loadDataEntries()) // Refresh the list after deletion
    );
  }

  // --- Helper for Autocomplete ---

  searchSpecies(query: string): Observable<Species[]> {
    return this.http.get<Species[]>(this.speciesApiUrl, {
      params: {search: query}
    });
  }
}
