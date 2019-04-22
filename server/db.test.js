const Database = require('./lib/database.js')
const db = new Database();

(async () => {

  await db.insert('VENKU', '/nova/sg_1549666217_4000000.ts')
  await db.insert('VENKU', '/nova/sg_1549666219_4000000.ts')
  await db.insert('VENKU', '/nova/sg_1549666220_4000000.ts')

  console.log('seek', await db.seek('VENKU', 1549666218, 1549666219))
  console.log('seekFrom', await db.seekFrom('VENKU', 1549666218))
  console.log('shift', await db.shift('VENKU', 60 * 60, 1))

  await db.removeOldScenesAndMotion('VENKU', 60)
  
  console.log('seek', await db.seek('VENKU', 1549666218, 1549666219))
  console.log('seekFrom', await db.seekFrom('VENKU', 1549666218))
  console.log('shift', await db.shift('VENKU', 60 * 60, 1))

  process.exit()
  // db.close()
})()
