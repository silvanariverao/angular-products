export interface Product {
  id: string;
  name: string;
  description: string;
  logo: string;          // nombre del archivo en /assets
  date_release: string;  // ISO string: 'YYYY-MM-DD'
  date_revision: string; // ISO string
}
