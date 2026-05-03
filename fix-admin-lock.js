const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/barangay_db';

async function fixAdmin() {
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        
        // Update admin user
        const result = await db.collection('users').updateOne(
            { username: 'admin' },
            { 
                $set: {
                    lockedUntil: null,
                    failedLoginAttempts: 0,
                    lastFailedLoginAt: null
                }
            }
        );
        
        console.log('Updated documents:', result.modifiedCount);
        
        // Check the user
        const admin = await db.collection('users').findOne({ username: 'admin' });
        console.log('Admin account after fix:');
        console.log('- Username:', admin.username);
        console.log('- Locked Until:', admin.lockedUntil);
        console.log('- Failed Attempts:', admin.failedLoginAttempts);
        
    } finally {
        await client.close();
    }
}

fixAdmin().catch(console.error).finally(() => process.exit(0));
