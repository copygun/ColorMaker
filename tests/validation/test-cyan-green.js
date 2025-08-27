/**
 * Test script for problematic cyan-green color
 * Target: L:80, a:-50, b:20
 * Previously showed Delta E of 12.60
 */

import { ProfessionalMixingEngine } from './core/professionalMixingEngine.js';
import { OptimizedMixingEngine } from './core/optimizedMixingEngine.js';
import { baseInks } from './core/inkDatabase.js';

async function testCyanGreen() {
    console.log('='.repeat(60));
    console.log('Testing Problematic Cyan-Green Color');
    console.log('Target: L:80, a:-50, b:20');
    console.log('='.repeat(60));
    
    const targetLab = { L: 80, a: -50, b: 20 };
    
    // Test with OptimizedMixingEngine first
    console.log('\n1. OptimizedMixingEngine Results:');
    console.log('-'.repeat(40));
    const optEngine = new OptimizedMixingEngine();
    const optResult = optEngine.findOptimalMix(targetLab, baseInks, {
        maxInks: 4,
        preferredConcentrations: [100, 70, 40],
        includeWhite: true,
        costWeight: 0.2
    });
    
    const formattedOpt = optEngine.formatResult(optResult);
    console.log('Delta E:', formattedOpt.deltaE);
    console.log('Quality:', formattedOpt.quality);
    console.log('Inks used:');
    if (formattedOpt.recipe && Array.isArray(formattedOpt.recipe)) {
        formattedOpt.recipe.forEach(ink => {
            console.log(`  - ${ink.name} ${ink.concentration}%: ${ink.percentage}%`);
        });
    } else {
        console.log('  No recipe available');
    }
    
    // Test with ProfessionalMixingEngine
    console.log('\n2. ProfessionalMixingEngine Results:');
    console.log('-'.repeat(40));
    const profEngine = new ProfessionalMixingEngine();
    const profResult = await profEngine.findProfessionalMix(targetLab, {
        maxInks: 5,
        includeWhite: true,
        concentrations: [100, 70, 40]
    });
    
    console.log('Type:', profResult.type);
    console.log('Delta E:', profResult.colorData?.deltaE?.toFixed(2));
    console.log('Quality:', profResult.colorData?.quality);
    
    if (profResult.recipe) {
        console.log('Recipe:');
        const recipeData = profResult.recipe.recipe || profResult.recipe.inks || profResult.recipe;
        if (Array.isArray(recipeData)) {
            recipeData.forEach(ink => {
                console.log(`  - ${ink.name} ${ink.concentration}%: ${ink.percentage}%`);
            });
        }
    }
    
    // Check if fluorescent inks are recommended
    if (profResult.fluorescenceData) {
        console.log('\n🌟 Fluorescent Enhancement:');
        console.log('UV Intensity:', (profResult.fluorescenceData.recommendedUVIntensity * 100).toFixed(0) + '%');
        console.log('Fluorescence Level:', profResult.fluorescenceData.effectiveFluorescence?.toFixed(2));
    }
    
    // Check metamerism
    if (profResult.metamerism) {
        console.log('\n🔍 Metamerism Analysis:');
        console.log(profResult.metamerism.warning);
    }
    
    // Show recommendations
    if (profResult.recommendations && profResult.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        profResult.recommendations.forEach(rec => {
            console.log(`  [${rec.type}] ${rec.message}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test Complete');
    console.log('Delta E improved from 12.60 to', profResult.colorData?.deltaE?.toFixed(2));
    console.log('='.repeat(60));
}

// Run test
testCyanGreen().catch(console.error);