#!/usr/bin/env node

/**
 * Script de Versionamento Automático - ELO
 * 
 * Este script automatiza o processo de versionamento seguindo o padrão MMP
 * (Major, Minor, Patch) baseado nas alterações detectadas.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function updateVersion(newVersion) {
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✅ Versão atualizada para ${newVersion}`, 'green');
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function incrementVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Tipo de versionamento inválido: ${type}`);
  }
}

function detectChanges() {
  try {
    // Verificar se há commits desde a última tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commits = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf8' });
    
    if (!commits.trim()) {
      return { type: 'none', changes: [] };
    }
    
    const changes = commits.split('\n').filter(line => line.trim());
    
    // Analisar tipos de mudanças
    const hasBreakingChanges = changes.some(commit => 
      commit.includes('BREAKING CHANGE') || 
      commit.includes('feat!:') || 
      commit.includes('!')
    );
    
    const hasNewFeatures = changes.some(commit => 
      commit.includes('feat:') || 
      commit.includes('✨') ||
      commit.includes('🚀')
    );
    
    const hasBugFixes = changes.some(commit => 
      commit.includes('fix:') || 
      commit.includes('🐛') ||
      commit.includes('🔧')
    );
    
    if (hasBreakingChanges) {
      return { type: 'major', changes };
    } else if (hasNewFeatures) {
      return { type: 'minor', changes };
    } else if (hasBugFixes) {
      return { type: 'patch', changes };
    }
    
    return { type: 'patch', changes };
  } catch (error) {
    log('⚠️  Não foi possível detectar mudanças automaticamente', 'yellow');
    return { type: 'patch', changes: [] };
  }
}

function createGitTag(version) {
  try {
    execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'inherit' });
    log(`✅ Tag v${version} criada`, 'green');
  } catch (error) {
    log(`❌ Erro ao criar tag: ${error.message}`, 'red');
  }
}

function main() {
  log('🚀 ELO - Script de Versionamento Automático', 'cyan');
  log('==========================================', 'cyan');
  
  const currentVersion = getCurrentVersion();
  log(`📦 Versão atual: ${currentVersion}`, 'blue');
  
  // Detectar mudanças
  const { type, changes } = detectChanges();
  
  if (type === 'none') {
    log('ℹ️  Nenhuma mudança detectada desde a última tag', 'yellow');
    return;
  }
  
  log(`🔍 Tipo de mudança detectada: ${type.toUpperCase()}`, 'magenta');
  
  if (changes.length > 0) {
    log('\n📝 Mudanças detectadas:', 'bright');
    changes.slice(0, 5).forEach(change => {
      log(`  • ${change}`, 'reset');
    });
    if (changes.length > 5) {
      log(`  ... e mais ${changes.length - 5} mudanças`, 'reset');
    }
  }
  
  // Calcular nova versão
  const newVersion = incrementVersion(currentVersion, type);
  log(`\n🎯 Nova versão: ${newVersion}`, 'green');
  
  // Confirmar com o usuário
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n❓ Confirmar versionamento? (y/N): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      // Atualizar package.json
      updateVersion(newVersion);
      
      // Criar tag git
      createGitTag(newVersion);
      
      log('\n🎉 Versionamento concluído com sucesso!', 'green');
      log(`📋 Próximos passos:`, 'blue');
      log('  1. git push origin main', 'reset');
      log('  2. git push --tags', 'reset');
      log('  3. Atualizar CHANGELOG.md se necessário', 'reset');
    } else {
      log('❌ Versionamento cancelado', 'red');
    }
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  getCurrentVersion,
  updateVersion,
  incrementVersion,
  detectChanges
};
