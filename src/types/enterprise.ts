export const ENTERPRISE_VALUES = [
  "NA",
  "Box",
  "RHenz",
  "Cristallux",
  "Box_Filial",
  "Cristallux_Filial",
] as const

export type Enterprise = (typeof ENTERPRISE_VALUES)[number]

