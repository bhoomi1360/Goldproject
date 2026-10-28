import { initializeDatabase, seedDefaultLoanSchemes } from './database.js';

console.log('🌱 Starting database seed...');
initializeDatabase();
seedDefaultLoanSchemes();
console.log('✅ Seed completed successfully with default loan schemes: PLAN_BULLET_01 and PLAN_EMI_01.');
