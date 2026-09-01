/* ============================================================================
   WHICH BRAND ARE WE
   The brands themselves live in src/brands/<id>/. This file only carries the
   current one down the tree.

   It deliberately imports nothing from src/brands. A brand may name a checkout
   flow, that flow names its steps, and a step asks which brand it is in — so
   if this file knew the brand registry, that circle would close and the module
   graph would deadlock at startup. Holding only the context keeps it a leaf
   that anything can import.
   ========================================================================= */

import { createContext, useContext, type ReactNode } from 'react';

import type { BrandConfig } from '../brands/types';

const BrandCtx = createContext<BrandConfig | null>(null);

export const BrandProvider = ({ brand, children }: { brand: BrandConfig; children: ReactNode }) => (
  <BrandCtx.Provider value={brand}>{children}</BrandCtx.Provider>
);

export const useBrand = (): BrandConfig => {
  const brand = useContext(BrandCtx);
  if (!brand) throw new Error('useBrand outside BrandProvider');
  return brand;
};

export type { BrandConfig as BrandConfig } from '../brands/types';
export type { BrandId as BrandId } from '../brands/types';
