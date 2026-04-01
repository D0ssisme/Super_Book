import Cart from '../models/Cart.js';

export async function cleanupCorruptedCarts() {
  try {
    console.log('Starting cleanup of corrupted cart documents...');
    
    // Remove carts with null or undefined customerId
    const result = await Cart.deleteMany({ 
      $or: [
        { customerId: null },
        { customerId: undefined },
        { customerId: { $exists: false } }
      ]
    });
    
    console.log(`Deleted ${result.deletedCount} corrupted cart documents`);
    
    // Drop and recreate index to ensure it's correct
    try {
      await Cart.collection.dropIndex('customerId_1');
      console.log('Dropped old customerId index');
    } catch (err) {
      console.log('No existing customerId index to drop, creating new one...');
    }
    
    // Create sparse unique index
    await Cart.collection.createIndex({ customerId: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique index on customerId');
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cleanup error:', error.message);
    throw error;
  }
}
