-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "expectedReturnPct" DECIMAL(5,2) NOT NULL DEFAULT 7,
ADD COLUMN     "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RetirementPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentAge" INTEGER NOT NULL,
    "retireAge" INTEGER NOT NULL,
    "lifeExpectancy" INTEGER NOT NULL,
    "annualSpendingUsd" DECIMAL(14,2) NOT NULL,
    "usInflationPct" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "inInflationPct" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "withdrawalTaxPct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "otherIncomeUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherIncomeStartAge" INTEGER NOT NULL DEFAULT 67,

    CONSTRAINT "RetirementPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetirementPlan_userId_key" ON "RetirementPlan"("userId");

-- AddForeignKey
ALTER TABLE "RetirementPlan" ADD CONSTRAINT "RetirementPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
