import { PrismaClient, ItemType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Default User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@5monkeys.com' },
    update: {},
    create: {
      email: 'admin@5monkeys.com',
      name: 'Admin User',
      role: 'ADMIN',
      pinCode: '1234'
    },
  })
  console.log({ admin })

  // 2. Kitchen Categories
  const kitchenCats = [
    'Proteins', 'Produce', 'Dairy', 'Frozen', 'Dry Goods', 'Spices', 'Sauces', 'Packaging', 'Cleaning'
  ]
  
  for (const cat of kitchenCats) {
    await prisma.category.create({
      data: {
        name: cat,
        type: 'KITCHEN',
        subCategories: {
          create: [{ name: 'General' }]
        }
      }
    })
  }

  // 3. Bar Categories
  const barCats = [
    'Whiskey', 'Bourbon', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Brandy/Cognac', 'Scotch', 'Liqueurs', 'Bitters/Syrups', 'Beer', 'Wine', 'Mixers', 'Garnish'
  ]

  for (const cat of barCats) {
    await prisma.category.create({
      data: {
        name: cat,
        type: 'BAR',
        subCategories: {
          create: [{ name: 'General' }]
        }
      }
    })
  }

  // 4. Hookah Categories
  const hookahCats = [
    'Flavors', 'Coals', 'Foil/Accessories', 'Mouth Tips', 'Hookah Parts', 'Cleaning supplies'
  ]

  for (const cat of hookahCats) {
    await prisma.category.create({
      data: {
        name: cat,
        type: 'HOOKAH',
        subCategories: {
          create: [{ name: 'General' }]
        }
      }
    })
  }
  
  // 5. Vendors
  await prisma.vendor.create({
    data: { name: 'Sysco', active: true }
  })
  await prisma.vendor.create({
    data: { name: 'Restaurant Depot', active: true }
  })
  await prisma.vendor.create({
    data: { name: 'Total Wine', active: true }
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
