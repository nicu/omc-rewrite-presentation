/* ============================================================================
   WHICH BRAND ARE WE
   The brands themselves live in src/brands/<id>/. This file only carries the
   current one down the tree.
   ========================================================================= */

import { createContext, useContext, type ReactNode } from 'react';

import { BRANDS, type BrandConfig } from '../brands';

const BrandCtx = createContext<BrandConfig>(BRANDS.atlas);

export const TenantProvider = ({ tenant, children }: { tenant: BrandConfig; children: ReactNode }) => (
  <BrandCtx.Provider value={tenant}>{children}</BrandCtx.Provider>
);

export const useTenant = () => useContext(BrandCtx);

export { BRANDS as TENANTS };
export type { BrandConfig as TenantConfig, BrandId as TenantId } from '../brands';
