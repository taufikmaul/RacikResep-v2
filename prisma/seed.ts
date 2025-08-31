import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default subscription plans
  const plans = [
    {
      name: 'Starter',
      description: 'Cocok untuk bisnis kecil yang baru memulai',
      price: 0,
      currency: 'IDR',
      interval: 'month',
      features: JSON.stringify([
        'Hingga 50 resep',
        'Hingga 200 bahan baku',
        'Kalkulasi biaya dasar',
        'Simulasi harga jual',
        'Sistem SKU otomatis',
        'Email support'
      ]),
      maxUsers: 1,
      maxRecipes: 50,
      maxIngredients: 200,
      isActive: true
    },
    {
      name: 'Professional',
      description: 'Solusi lengkap untuk bisnis yang berkembang',
      price: 99000,
      currency: 'IDR',
      interval: 'month',
      features: JSON.stringify([
        'Hingga 500 resep',
        'Hingga 2000 bahan baku',
        'Semua fitur Starter',
        'Analisis bisnis lanjutan',
        'Export data ke Excel/PDF',
        'Priority support',
        'Backup otomatis'
      ]),
      maxUsers: 3,
      maxRecipes: 500,
      maxIngredients: 2000,
      isActive: true
    },
    {
      name: 'Enterprise',
      description: 'Untuk bisnis besar dengan kebutuhan khusus',
      price: 199000,
      currency: 'IDR',
      interval: 'month',
      features: JSON.stringify([
        'Resep & bahan unlimited',
        'Semua fitur Professional',
        'Multi-user access',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee'
      ]),
      maxUsers: 10,
      maxRecipes: -1, // unlimited
      maxIngredients: -1, // unlimited
      isActive: true
    }
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    })
    console.log(`✅ Created/Updated plan: ${plan.name}`)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
