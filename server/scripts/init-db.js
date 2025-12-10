const bcrypt = require('bcryptjs');
const db = require('../database/db');

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);

    // Create users
    await db.query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES 
        ('admin', $1, 'admin'),
        ('supervisor', $2, 'supervisor'),
        ('manager', $3, 'management')
      ON CONFLICT (username) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash
    `, [adminPassword, supervisorPassword, managerPassword]);

    console.log('✓ Users created/updated:');
    console.log('  - admin / admin123 (role: admin)');
    console.log('  - supervisor / supervisor123 (role: supervisor)');
    console.log('  - manager / manager123 (role: management)');

    // Create sample operators
    const operators = [
      'Иванова Мария Петровна',
      'Петров Сергей Александрович',
      'Сидорова Анна Ивановна'
    ];

    for (const name of operators) {
      await db.query(
        'INSERT INTO operators (full_name) VALUES ($1) ON CONFLICT DO NOTHING',
        [name]
      );
    }

    console.log('✓ Sample operators created');
    console.log('\nDatabase initialization completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
