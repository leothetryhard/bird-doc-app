export interface ApiState<T> {
  data: T;
  loading: boolean;
  error: any | null;
}
