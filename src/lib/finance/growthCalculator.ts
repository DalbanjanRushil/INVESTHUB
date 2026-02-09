// Growth Calculator Utility Functions
// Calculates portfolio growth projections using simple and compound interest formulas

export interface GrowthInput {
    principal: number;
    roiRate: number; // Annual ROI as percentage (e.g., 24 for 24%)
    timePeriod: number; // In months
    compoundingMode: 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    payoutMode: 'COMPOUND' | 'PAYOUT';
}

export interface GrowthOutput {
    finalValue: number;
    totalProfit: number;
    growthPercentage: number;
    monthlyBreakdown: Array<{
        month: number;
        value: number;
        profit: number;
    }>;
}

/**
 * Calculate simple growth (no compounding)
 * Formula: FV = P × (1 + r × t)
 */
function calculateSimpleGrowth(principal: number, annualRate: number, timeInYears: number): number {
    return principal * (1 + annualRate * timeInYears);
}

/**
 * Calculate compound growth
 * Formula: FV = P × (1 + r/n)^(n×t)
 * @param principal - Initial capital
 * @param annualRate - Annual rate as decimal (e.g., 0.24 for 24%)
 * @param timeInYears - Time period in years
 * @param compoundingsPerYear - Number of compounding periods per year
 */
function calculateCompoundGrowth(
    principal: number,
    annualRate: number,
    timeInYears: number,
    compoundingsPerYear: number
): number {
    return principal * Math.pow(1 + annualRate / compoundingsPerYear, compoundingsPerYear * timeInYears);
}

/**
 * Main growth calculation function
 * Supports both simple and compound growth with monthly breakdowns
 */
export function calculateGrowth(input: GrowthInput): GrowthOutput | null {
    const { principal, roiRate, timePeriod, compoundingMode, payoutMode } = input;

    // Safety Guards: Return null for invalid inputs
    if (principal < 0 || roiRate < 0 || timePeriod <= 0) {
        return null;
    }

    // Convert inputs
    const annualRateDecimal = roiRate / 100;
    const timeInYears = timePeriod / 12;

    let finalValue: number;
    const monthlyBreakdown: Array<{ month: number; value: number; profit: number }> = [];

    // Determine compounding frequency
    let compoundingsPerYear = 1; // Default yearly
    switch (compoundingMode) {
        case 'MONTHLY':
            compoundingsPerYear = 12;
            break;
        case 'QUARTERLY':
            compoundingsPerYear = 4;
            break;
        case 'YEARLY':
            compoundingsPerYear = 1;
            break;
        case 'NONE':
        default:
            compoundingsPerYear = 0; // Simple interest
            break;
    }

    // Calculate based on mode
    if (compoundingMode === 'NONE' || payoutMode === 'PAYOUT') {
        // Simple growth or payout mode (no compounding)
        finalValue = calculateSimpleGrowth(principal, annualRateDecimal, timeInYears);

        // Monthly breakdown for simple growth
        for (let month = 1; month <= timePeriod; month++) {
            const timeElapsed = month / 12;
            const value = calculateSimpleGrowth(principal, annualRateDecimal, timeElapsed);
            const profit = value - principal;
            monthlyBreakdown.push({ month, value, profit });
        }
    } else {
        // Compound growth
        finalValue = calculateCompoundGrowth(principal, annualRateDecimal, timeInYears, compoundingsPerYear);

        // Monthly breakdown for compound growth
        for (let month = 1; month <= timePeriod; month++) {
            const timeElapsed = month / 12;
            const value = calculateCompoundGrowth(principal, annualRateDecimal, timeElapsed, compoundingsPerYear);
            const profit = value - principal;
            monthlyBreakdown.push({ month, value, profit });
        }
    }

    const totalProfit = finalValue - principal;
    const growthPercentage = principal > 0 ? (totalProfit / principal) * 100 : 0;

    return {
        finalValue: Number(finalValue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        growthPercentage: Number(growthPercentage.toFixed(2)),
        monthlyBreakdown,
    };
}

/**
 * Compare simple vs compound growth
 */
export function compareGrowthModes(principal: number, roiRate: number, timePeriod: number) {
    const simpleGrowth = calculateGrowth({
        principal,
        roiRate,
        timePeriod,
        compoundingMode: 'NONE',
        payoutMode: 'PAYOUT',
    });

    const compoundGrowth = calculateGrowth({
        principal,
        roiRate,
        timePeriod,
        compoundingMode: 'MONTHLY',
        payoutMode: 'COMPOUND',
    });

    if (!simpleGrowth || !compoundGrowth) {
        return null; // Return null if either calculation failed (e.g. invalid inputs)
    }

    return {
        simple: simpleGrowth,
        compound: compoundGrowth,
        compoundingBenefit: compoundGrowth.totalProfit - simpleGrowth.totalProfit,
    };
}

/**
 * Calculate required ROI to reach a target value
 */
export function calculateRequiredROI(principal: number, targetValue: number, timePeriod: number): number {
    if (principal <= 0 || timePeriod <= 0) return 0;

    const timeInYears = timePeriod / 12;
    const requiredRate = (targetValue / principal - 1) / timeInYears;
    return Number((requiredRate * 100).toFixed(2));
}
