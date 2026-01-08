export type AttributeType = 'INT' | 'VARCHAR' | 'BOOLEAN' | 'TIMESTAMP' | 'UUID' | 'TEXT' | 'DECIMAL' | 'JSON' | 'BIGINT' | 'DATETIME';

export interface ERDAttribute {
  id: string;
  name: string;
  type: AttributeType;
  isPrimary: boolean;
  isNullable: boolean;
  autoIncrement?: boolean;
}

export interface ERDComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface ERDEntity {
  id: string;
  name: string;
  description?: string;
  attributes: ERDAttribute[];
  comments?: ERDComment[];
}

export type Cardinality = '1:1' | '1:N' | 'N:M';

export interface ERDRelationship {
  id: string;
  source: string;
  target: string;
  cardinality: Cardinality;
  label?: string;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface Diagram {
  id: string;
  name: string;
  data: {
    nodes: any[];
    edges: any[];
  };
  created_at: string;
  updated_at: string;
  owner_id: string;
}