
export type AttributeType = 'INT' | 'VARCHAR' | 'BOOLEAN' | 'TIMESTAMP' | 'UUID' | 'TEXT' | 'DECIMAL' | 'JSON';

export interface ERDAttribute {
  id: string;
  name: string;
  type: AttributeType;
  isPrimary: boolean;
  isNullable: boolean;
}

export interface ERDEntity {
  id: string;
  name: string;
  attributes: ERDAttribute[];
}

export type Cardinality = '1:1' | '1:N' | 'N:M';

export interface ERDRelationship {
  id: string;
  source: string;
  target: string;
  cardinality: Cardinality;
  label?: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface AppState {
  nodes: any[];
  edges: any[];
  collaborators: User[];
  currentUser: User;
}
