import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataEntry } from '../models/data-entry.model';
import { Species } from '../models/species.model';
import { Ring } from '../models/ring.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api'; // Adjust to your API base URL

  // Data Entry Methods
  getDataEntries(): Observable<DataEntry[]> {
    return this.http.get<DataEntry[]>(`${this.apiUrl}/data-entries/`);
  }

  getDataEntry(id: string): Observable<DataEntry> {
    return this.http.get<DataEntry>(`${this.apiUrl}/data-entries/${id}/`);
  }

  createDataEntry(dataEntry: Partial<DataEntry>): Observable<DataEntry> {
    return this.http.post<DataEntry>(`${this.apiUrl}/data-entries/`, dataEntry);
  }

  updateDataEntry(id: string, dataEntry: Partial<DataEntry>): Observable<DataEntry> {
    return this.http.put<DataEntry>(`${this.apiUrl}/data-entries/${id}/`, dataEntry);
  }

  // Species Methods
  getSpecies(searchTerm?: string): Observable<Species[]> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    return this.http.get<Species[]>(`${this.apiUrl}/species/`, { params });
  }

  // Ring Methods
  getRings(): Observable<Ring[]> {
    return this.http.get<Ring[]>(`${this.apiUrl}/rings/`);
  }
}
