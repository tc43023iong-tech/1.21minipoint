
export interface Student {
  id: number;
  name: string;
  points: number;
  pokemonId: number;
  plusPoints: number;
  minusPoints: number;
}

export interface ClassData {
  id: string;
  name: string;
  students: Student[];
}

export interface ScoreAction {
  label: string;
  labelEn: string;
  value: number;
  icon: string;
}

export enum SortType {
  ID = 'ID',
  SCORE_HI_LO = 'SCORE_HI_LO',
  SCORE_LO_HI = 'SCORE_LO_HI'
}

export interface AppState {
  classes: ClassData[];
  selectedClassId: string;
}
