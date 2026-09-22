import { Customer, ProductItem, LookupData, SalesOrder, SalesInvoice, PosSale } from '../types';

export const INITIAL_LOOKUP_DATA: LookupData = {
  subCompanies: [
    'شركة دار السلام للتجارة العامة',
    'مؤسسة النور للتوزيع والتوريدات',
    'الشركة الدولية للمواد الغذائية'
  ],
  itemTypes: [
    'مواد غذائية معبأة',
    'مشروبات وسوائل',
    'زيوت ودهون غذائية',
    'حلويات وسكاكر',
    'منظفات ومطهرات'
  ],
  warehouses: [
    'المستودع الرئيسي - المنطقة الصناعية',
    'مستودع التوزيع السريع - الفرع الجنوبي',
    'مستودع الأمانات والتحميل'
  ],
  salesReps: [
    'SA (Super Admin)',
    'أحمد مصطفى (مندوب توزيع 1)',
    'محمود الشريف (مندوب جملة)',
    'طارق إبراهيم (مسؤول فرع)'
  ],
  branches: [
    'الفرع الرئيسي (SA)',
    'فرع الرياض / القاهرة',
    'فرع التوزيع المركزي'
  ]
};

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-walkin',
    name: 'Walk in Customer (عميل نقدي)',
    taxNumber: '0000000000',
    phone: '0000000000',
    creditLimit: 9999999,
    currentBalance: 0,
    cardNumber: '0',
    branchName: 'الفرع الرئيسي'
  },
  {
    id: 'cust-1',
    name: 'شركة الأمل لتجارة التجزئة',
    taxNumber: '300124567800003',
    phone: '0501234567',
    creditLimit: 50000,
    currentBalance: 12500,
    cardNumber: '1042',
    branchName: 'فرع المروج'
  },
  {
    id: 'cust-2',
    name: 'مؤسسة البركة للمواد الغذائية',
    taxNumber: '310987654300003',
    phone: '0559876543',
    creditLimit: 30000,
    currentBalance: 28500, // Near credit limit!
    cardNumber: '2085',
    branchName: 'فرع الملز'
  },
  {
    id: 'cust-3',
    name: 'سوبرماركت التوحيد والصفا',
    taxNumber: '302345678900003',
    phone: '0543322110',
    creditLimit: 75000,
    currentBalance: 14200,
    cardNumber: '3120',
    branchName: 'فرع النزهة'
  },
  {
    id: 'cust-4',
    name: 'مجموعة الفجر للتوزيع السريع',
    taxNumber: '304556677800003',
    phone: '0567788990',
    creditLimit: 100000,
    currentBalance: 105000, // Over credit limit!
    cardNumber: '4450',
    branchName: 'فرع العقيق'
  }
];

export const PRODUCT_IMAGES: Record<string, string> = {
  '1001': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80', // olive oil
  '1002': 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=200&auto=format&fit=crop&q=80', // sugar
  '1003': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80', // rice
  '1004': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', // tea
  '1005': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=200&auto=format&fit=crop&q=80', // pasta
  '1006': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22501?w=200&auto=format&fit=crop&q=80', // tomato paste
  '1007': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=200&auto=format&fit=crop&q=80', // tuna
  '1008': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80', // flour
  '1009': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&auto=format&fit=crop&q=80', // milk
  '1010': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&auto=format&fit=crop&q=80', // cheese
  '1011': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&auto=format&fit=crop&q=80', // honey
  '1012': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', // coffee
  '1013': 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=200&auto=format&fit=crop&q=80', // sunflower oil
  '1014': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80', // oats
  '1015': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80', // biscuits
  '1016': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&auto=format&fit=crop&q=80', // fava beans
  '1017': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200&auto=format&fit=crop&q=80', // sweet corn
  '1018': 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=200&auto=format&fit=crop&q=80', // detergent
  '1019': 'https://images.unsplash.com/photo-1585670270608-b4be4fb88f72?w=200&auto=format&fit=crop&q=80', // dishwashing
  '1020': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80', // facial tissues
  '1021': 'https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=200&auto=format&fit=crop&q=80', // toothpaste
  '1022': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&auto=format&fit=crop&q=80', // chocolate
  '1023': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&auto=format&fit=crop&q=80', // water
  '1024': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80', // napkins
  '1025': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80'  // mushrooms
};

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    code: '1001',
    barcode: '6221155901234',
    name: 'زيت زيتون بكر ممتاز 1 لتر',
    nameEn: 'Extra Virgin Olive Oil 1L',
    shelfNumber: 'A-01-03',
    unit: 'كرتونة (12 حبة)',
    unitEn: 'Carton (12 pcs)',
    availableQty: 140,
    unitPrice: 320,
    defaultDiscount: 5,
    category: 'زيوت ودهون غذائية'
  },
  {
    id: 'prod-2',
    code: '1002',
    barcode: '6221155905678',
    name: 'سكر أبيض ناعم 1 كجم',
    nameEn: 'Fine White Sugar 1kg',
    shelfNumber: 'B-04-12',
    unit: 'شوال (10 كجم)',
    unitEn: 'Bag (10 kg)',
    availableQty: 85,
    unitPrice: 180,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-3',
    code: '1003',
    barcode: '6221155909988',
    name: 'أرز مصري فاخر عريض الحبة 5 كجم',
    nameEn: 'Premium Egyptian Rice 5kg',
    shelfNumber: 'B-02-08',
    unit: 'كيس 5 كجم',
    unitEn: 'Bag 5kg',
    availableQty: 42,
    unitPrice: 145,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-4',
    code: '1004',
    barcode: '6221155903344',
    name: 'شاي أسود فاخر 100 فتلة',
    nameEn: 'Premium Black Tea 100 Bags',
    shelfNumber: 'C-01-05',
    unit: 'كرتونة (24 عبوة)',
    unitEn: 'Carton (24 packs)',
    availableQty: 60,
    unitPrice: 210,
    defaultDiscount: 10,
    category: 'مشروبات وسوائل'
  },
  {
    id: 'prod-5',
    code: '1005',
    barcode: '6221155907722',
    name: 'مكرونة فرن إيطالية 400 جم',
    nameEn: 'Penne Pasta 400g',
    shelfNumber: 'A-03-15',
    unit: 'كرتونة (20 كيس)',
    unitEn: 'Carton (20 bags)',
    availableQty: 95,
    unitPrice: 110,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-6',
    code: '1006',
    barcode: '6221155908811',
    name: 'صلصة طماطم مركزة 360 جم',
    nameEn: 'Tomato Paste Jar 360g',
    shelfNumber: 'A-02-04',
    unit: 'صندوق (12 برطمان)',
    unitEn: 'Box (12 jars)',
    availableQty: 8, // Low stock
    unitPrice: 95,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-7',
    code: '1007',
    barcode: '6221155904499',
    name: 'تونة قطعة واحدة في زيت دوار الشمس 185 جم',
    nameEn: 'Solid Tuna in Sunflower Oil 185g',
    shelfNumber: 'C-05-02',
    unit: 'صندوق (24 علبة)',
    unitEn: 'Box (24 cans)',
    availableQty: 0, // Out of stock
    unitPrice: 260,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-8',
    code: '1008',
    barcode: '6221155902233',
    name: 'دقيق قمح فاخر لجميع الأغراض 1 كجم',
    nameEn: 'All Purpose White Flour 1kg',
    shelfNumber: 'B-01-09',
    unit: 'كرتونة (10 أكياس)',
    unitEn: 'Carton (10 bags)',
    availableQty: 120,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-9',
    code: '1009',
    barcode: '6221155903322',
    name: 'حليب مجفف كامل الدسم 900 جم',
    nameEn: 'Full Cream Milk Powder 900g',
    shelfNumber: 'C-02-14',
    unit: 'علبة صفيح',
    unitEn: 'Tin Can',
    availableQty: 55,
    unitPrice: 75,
    defaultDiscount: 2,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-10',
    code: '1010',
    barcode: '6221155904411',
    name: 'جبنة بيضاء فيتا فاخرة 500 جم',
    nameEn: 'Feta White Cheese 500g',
    shelfNumber: 'D-01-02',
    unit: 'كرتونة (12 حبة)',
    unitEn: 'Carton (12 pcs)',
    availableQty: 70,
    unitPrice: 135,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-11',
    code: '1011',
    barcode: '6221155905599',
    name: 'عسل نحل زهور طبيعي 500 جم',
    nameEn: 'Pure Natural Flower Honey 500g',
    shelfNumber: 'A-04-06',
    unit: 'كرتونة (12 برطمان)',
    unitEn: 'Carton (12 jars)',
    availableQty: 38,
    unitPrice: 290,
    defaultDiscount: 10,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-12',
    code: '1012',
    barcode: '6221155906688',
    name: 'بن قهوة تركي محوج بالهيل 250 جم',
    nameEn: 'Turkish Coffee with Cardamom 250g',
    shelfNumber: 'C-03-01',
    unit: 'باكيت (12 كيس)',
    unitEn: 'Pack (12 bags)',
    availableQty: 48,
    unitPrice: 195,
    defaultDiscount: 5,
    category: 'مشروبات وسوائل'
  },
  {
    id: 'prod-13',
    code: '1013',
    barcode: '6221155907744',
    name: 'زيت دوار الشمس النقي 1.5 لتر',
    nameEn: 'Pure Sunflower Cooking Oil 1.5L',
    shelfNumber: 'A-01-08',
    unit: 'كرتونة (6 حبات)',
    unitEn: 'Carton (6 pcs)',
    availableQty: 110,
    unitPrice: 160,
    defaultDiscount: 0,
    category: 'زيوت ودهون غذائية'
  },
  {
    id: 'prod-14',
    code: '1014',
    barcode: '6221155908855',
    name: 'شوفان حبوب كاملة تقليدي 500 جم',
    nameEn: 'Whole Grain Rolled Oats 500g',
    shelfNumber: 'B-03-04',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 62,
    unitPrice: 140,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-15',
    code: '1015',
    barcode: '6221155909966',
    name: 'بسكويت شاي مقرمش سادة',
    nameEn: 'Plain Tea Biscuits Pack',
    shelfNumber: 'E-01-11',
    unit: 'صندوق (24 باكو)',
    unitEn: 'Box (24 packs)',
    availableQty: 80,
    unitPrice: 90,
    defaultDiscount: 0,
    category: 'حلويات وسكاكر'
  },
  {
    id: 'prod-16',
    code: '1016',
    barcode: '6221155910077',
    name: 'فول مدمس درجة أولى معلب 400 جم',
    nameEn: 'Premium Fava Beans Canned 400g',
    shelfNumber: 'C-04-03',
    unit: 'كرتونة (24 علبة)',
    unitEn: 'Carton (24 cans)',
    availableQty: 130,
    unitPrice: 125,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-17',
    code: '1017',
    barcode: '6221155911188',
    name: 'ذرة حلوة ذهبية حبوب كاملة 340 جم',
    nameEn: 'Sweet Golden Corn Canned 340g',
    shelfNumber: 'C-04-09',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 cans)',
    availableQty: 45,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-18',
    code: '1018',
    barcode: '6221155912299',
    name: 'مسحوق غسيل ملابس أوتوماتيك 3 كجم',
    nameEn: 'Automatic Laundry Powder 3kg',
    shelfNumber: 'F-02-05',
    unit: 'كيس 3 كجم',
    unitEn: 'Bag 3kg',
    availableQty: 65,
    unitPrice: 95,
    defaultDiscount: 3,
    category: 'منظفات ومطهرات'
  },
  {
    id: 'prod-19',
    code: '1019',
    barcode: '6221155913300',
    name: 'سائل غسيل أطباق برائحة الليمون 1 لتر',
    nameEn: 'Dishwashing Liquid Lemon 1L',
    shelfNumber: 'F-01-08',
    unit: 'كرتونة (12 عبوة)',
    unitEn: 'Carton (12 pcs)',
    availableQty: 90,
    unitPrice: 115,
    defaultDiscount: 0,
    category: 'منظفات ومطهرات'
  },
  {
    id: 'prod-20',
    code: '1020',
    barcode: '6221155914411',
    name: 'مناديل ورقية فاخرة ناعمة (عبوة 3 علب)',
    nameEn: 'Facial Tissues Premium 3-Pack',
    shelfNumber: 'F-03-01',
    unit: 'كرتونة (10 حزم)',
    unitEn: 'Carton (10 packs)',
    availableQty: 105,
    unitPrice: 130,
    defaultDiscount: 5,
    category: 'منظفات ومطهرات'
  },
  {
    id: 'prod-21',
    code: '1021',
    barcode: '6221155915522',
    name: 'معجون أسنان حماية متكاملة 100 مل',
    nameEn: 'Total Care Toothpaste 100ml',
    shelfNumber: 'F-04-02',
    unit: 'كرتونة (24 أنبوب)',
    unitEn: 'Carton (24 tubes)',
    availableQty: 72,
    unitPrice: 175,
    defaultDiscount: 0,
    category: 'منظفات ومطهرات'
  },
  {
    id: 'prod-22',
    code: '1022',
    barcode: '6221155916633',
    name: 'مياه معدنية نقية 330 مل (كرتونة 40 حبة)',
    nameEn: 'Natural Mineral Water 330ml 40-pack',
    shelfNumber: 'D-03-10',
    unit: 'كرتونة (40 قارورة)',
    unitEn: 'Carton (40 bottles)',
    availableQty: 250,
    unitPrice: 28,
    defaultDiscount: 0,
    category: 'مشروبات وسوائل'
  },
  {
    id: 'prod-23',
    code: '1023',
    barcode: '6221155917744',
    name: 'ملح طعام بحري يودي ناعم 700 جم',
    nameEn: 'Iodized Fine Table Salt 700g',
    shelfNumber: 'B-01-02',
    unit: 'كرتونة (20 كيس)',
    unitEn: 'Carton (20 bags)',
    availableQty: 160,
    unitPrice: 40,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-24',
    code: '1024',
    barcode: '6221155918855',
    name: 'شعيرية سريعة التحضير نكهة الدجاج (كرتونة 40 كيس)',
    nameEn: 'Instant Noodles Chicken Flavor (40-pack)',
    shelfNumber: 'A-05-01',
    unit: 'كرتونة (40 كيس)',
    unitEn: 'Carton (40 bags)',
    availableQty: 85,
    unitPrice: 105,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  {
    id: 'prod-25',
    code: '1025',
    barcode: '6221155919966',
    name: 'مرقة دجاج فورية مكعبات (علبة 24 مكعب)',
    nameEn: 'Instant Chicken Bouillon 24 Cubes',
    shelfNumber: 'A-02-12',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 boxes)',
    availableQty: 92,
    unitPrice: 65,
    defaultDiscount: 0,
    category: 'مواد غذائية معبأة'
  },
  // 10 Chipsy Items
  {
    id: 'prod-c1',
    code: '2001',
    barcode: '6221155920011',
    name: 'شيبسي بالملح الأصلي عائلي',
    nameEn: 'Chipsy Salt Family Pack',
    shelfNumber: 'S-01-01',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 150,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c2',
    code: '2002',
    barcode: '6221155920022',
    name: 'شيبسي بالفلفل الحلو والليمون',
    nameEn: 'Chipsy Chili & Lemon',
    shelfNumber: 'S-01-02',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 120,
    unitPrice: 85,
    defaultDiscount: 5,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c3',
    code: '2003',
    barcode: '6221155920033',
    name: 'شيبسي بالجبنة المتبلة اللذيذة',
    nameEn: 'Chipsy Seasoned Cheese',
    shelfNumber: 'S-01-03',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 180,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c4',
    code: '2004',
    barcode: '6221155920044',
    name: 'شيبسي بالطماطم المتبلة',
    nameEn: 'Chipsy Tomato Flavor',
    shelfNumber: 'S-01-04',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 90,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c5',
    code: '2005',
    barcode: '6221155920055',
    name: 'شيبسي بالخل والملح البحري',
    nameEn: 'Chipsy Salt & Vinegar',
    shelfNumber: 'S-01-05',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 110,
    unitPrice: 85,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c6',
    code: '2006',
    barcode: '6221155920066',
    name: 'دوريتوس بطعم الجبنة الناتشو',
    nameEn: 'Doritos Nacho Cheese',
    shelfNumber: 'S-02-01',
    unit: 'كرتونة (20 كيس)',
    unitEn: 'Carton (20 bags)',
    availableQty: 130,
    unitPrice: 110,
    defaultDiscount: 5,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c7',
    code: '2007',
    barcode: '6221155920077',
    name: 'دوريتوس حار حلو مكسيكي',
    nameEn: 'Doritos Sweet & Spicy',
    shelfNumber: 'S-02-02',
    unit: 'كرتونة (20 كيس)',
    unitEn: 'Carton (20 bags)',
    availableQty: 95,
    unitPrice: 110,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c8',
    code: '2008',
    barcode: '6221155920088',
    name: 'صن بايتس خبز محمص بزيت الزيتون والزعتر',
    nameEn: 'Sunbites Roasted Herbs',
    shelfNumber: 'S-03-01',
    unit: 'كرتونة (24 كيس)',
    unitEn: 'Carton (24 bags)',
    availableQty: 80,
    unitPrice: 95,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c9',
    code: '2009',
    barcode: '6221155920099',
    name: 'شيبسي ماكس جبنة وتشيدر حارة',
    nameEn: 'Chipsy Max Hot Cheddar',
    shelfNumber: 'S-03-02',
    unit: 'كرتونة (20 كيس)',
    unitEn: 'Carton (20 bags)',
    availableQty: 75,
    unitPrice: 100,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  {
    id: 'prod-c10',
    code: '2010',
    barcode: '6221155920105',
    name: 'كاراتيه كرانش بالجبنة الصفراء',
    nameEn: 'Karateh Cheese Crunch',
    shelfNumber: 'S-03-03',
    unit: 'كرتونة (30 كيس)',
    unitEn: 'Carton (30 bags)',
    availableQty: 140,
    unitPrice: 70,
    defaultDiscount: 0,
    category: 'شيبسي ومقرمشات'
  },
  // 15 Shell Oil Items
  {
    id: 'prod-s1',
    code: '3001',
    barcode: '6221155930010',
    name: 'زيت شل هيلكس الترا 5W-40 تخليقي 4 لتر',
    nameEn: 'Shell Helix Ultra 5W-40 4L',
    shelfNumber: 'O-01-01',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 cans)',
    availableQty: 60,
    unitPrice: 680,
    defaultDiscount: 20,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s2',
    code: '3002',
    barcode: '6221155930027',
    name: 'زيت شل هيلكس HX7 10W-40 نصف تخليقي 4 لتر',
    nameEn: 'Shell Helix HX7 10W-40 4L',
    shelfNumber: 'O-01-02',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 cans)',
    availableQty: 85,
    unitPrice: 490,
    defaultDiscount: 15,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s3',
    code: '3003',
    barcode: '6221155930034',
    name: 'زيت شل هيلكس HX5 15W-50 معدني فائق 4 لتر',
    nameEn: 'Shell Helix HX5 15W-50 4L',
    shelfNumber: 'O-01-03',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 cans)',
    availableQty: 100,
    unitPrice: 380,
    defaultDiscount: 10,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s4',
    code: '3004',
    barcode: '6221155930041',
    name: 'زيت شل هيلكس HX3 20W-50 أحمر 4 لتر',
    nameEn: 'Shell Helix HX3 20W-50 4L',
    shelfNumber: 'O-01-04',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 cans)',
    availableQty: 110,
    unitPrice: 310,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s5',
    code: '3005',
    barcode: '6221155930058',
    name: 'زيت شل ريمولا R4X 15W-40 ديزل شاق 20 لتر',
    nameEn: 'Shell Rimula R4X 15W-40 20L',
    shelfNumber: 'O-02-01',
    unit: 'برميل 20 لتر',
    unitEn: 'Pail 20L',
    availableQty: 45,
    unitPrice: 1250,
    defaultDiscount: 50,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s6',
    code: '3006',
    barcode: '6221155930065',
    name: 'زيت شل ريمولا R3X 20W-50 شاحنات 20 لتر',
    nameEn: 'Shell Rimula R3X 20W-50 20L',
    shelfNumber: 'O-02-02',
    unit: 'برميل 20 لتر',
    unitEn: 'Pail 20L',
    availableQty: 50,
    unitPrice: 1100,
    defaultDiscount: 40,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s7',
    code: '3007',
    barcode: '6221155930072',
    name: 'زيت تروس شل سبايراكس S2 A 80W-90 دفرنس',
    nameEn: 'Shell Spirax S2 A 80W-90 Gear Oil',
    shelfNumber: 'O-03-01',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 cans)',
    availableQty: 70,
    unitPrice: 420,
    defaultDiscount: 10,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s8',
    code: '3008',
    barcode: '6221155930089',
    name: 'زيت تروس شل سبايراكس S2 A 85W-140 ثقيل',
    nameEn: 'Shell Spirax S2 A 85W-140 Heavy',
    shelfNumber: 'O-03-02',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 cans)',
    availableQty: 65,
    unitPrice: 450,
    defaultDiscount: 10,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s9',
    code: '3009',
    barcode: '6221155930096',
    name: 'زيت فتيس أوتوماتيك شل سبايراكس ATF D2',
    nameEn: 'Shell Spirax S2 ATF D2 Transmission',
    shelfNumber: 'O-03-03',
    unit: 'كرتونة (12 لتر)',
    unitEn: 'Carton (12L)',
    availableQty: 90,
    unitPrice: 390,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s10',
    code: '3010',
    barcode: '6221155930102',
    name: 'سائل تبريد رادياتير شل 4 لتر لون أخضر',
    nameEn: 'Shell Coolant Longlife Green 4L',
    shelfNumber: 'O-04-01',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 pcs)',
    availableQty: 80,
    unitPrice: 220,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s11',
    code: '3011',
    barcode: '6221155930119',
    name: 'سائل تبريد رادياتير شل 4 لتر لون أحمر OAT',
    nameEn: 'Shell Coolant Longlife Red 4L',
    shelfNumber: 'O-04-02',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 pcs)',
    availableQty: 75,
    unitPrice: 240,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s12',
    code: '3012',
    barcode: '6221155930126',
    name: 'شحم شل جادوس S2 V220 رولمان بلي 1 كجم',
    nameEn: 'Shell Gadus S2 V220 Grease 1kg',
    shelfNumber: 'O-04-03',
    unit: 'صندوق (12 علبة)',
    unitEn: 'Box (12 cans)',
    availableQty: 60,
    unitPrice: 360,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s13',
    code: '3013',
    barcode: '6221155930133',
    name: 'زيت فرامل شل DOT 4 حماية فائقة 500 مل',
    nameEn: 'Shell Brake Fluid DOT 4 500ml',
    shelfNumber: 'O-04-04',
    unit: 'كرتونة (24 عبوة)',
    unitEn: 'Carton (24 pcs)',
    availableQty: 120,
    unitPrice: 290,
    defaultDiscount: 0,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s14',
    code: '3014',
    barcode: '6221155930140',
    name: 'زيت هيدروليك شل تيلوس S2 M 46 للمعدات 20 لتر',
    nameEn: 'Shell Tellus S2 M 46 Hydraulic 20L',
    shelfNumber: 'O-05-01',
    unit: 'برميل 20 لتر',
    unitEn: 'Pail 20L',
    availableQty: 30,
    unitPrice: 980,
    defaultDiscount: 30,
    category: 'زيوت شل ومحركات'
  },
  {
    id: 'prod-s15',
    code: '3015',
    barcode: '6221155930157',
    name: 'زيت شل هيلكس ألترا 0W-20 موفر للوقود 4 لتر',
    nameEn: 'Shell Helix Ultra 0W-20 Eco 4L',
    shelfNumber: 'O-05-02',
    unit: 'كرتونة (4 جراكن)',
    unitEn: 'Carton (4 cans)',
    availableQty: 40,
    unitPrice: 720,
    defaultDiscount: 25,
    category: 'زيوت شل ومحركات'
  },
  // 10 Juices Items
  {
    id: 'prod-j1',
    code: '4001',
    barcode: '6221155940019',
    name: 'عصير جهينة برتقال 100% بيور 1 لتر',
    nameEn: 'Juhayna Pure Orange 1L',
    shelfNumber: 'J-01-01',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 160,
    unitPrice: 135,
    defaultDiscount: 5,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j2',
    code: '4002',
    barcode: '6221155940026',
    name: 'عصير جهينة مانجو طبيعي فاخر 1 لتر',
    nameEn: 'Juhayna Natural Mango 1L',
    shelfNumber: 'J-01-02',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 140,
    unitPrice: 145,
    defaultDiscount: 5,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j3',
    code: '4003',
    barcode: '6221155940033',
    name: 'عصير جهينة تفاح بدون سكر مضاف 1 لتر',
    nameEn: 'Juhayna Apple No Sugar 1L',
    shelfNumber: 'J-01-03',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 120,
    unitPrice: 135,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j4',
    code: '4004',
    barcode: '6221155940040',
    name: 'عصير جهينة جوافة باللبن الطبيعي 1 لتر',
    nameEn: 'Juhayna Guava with Milk 1L',
    shelfNumber: 'J-01-04',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 110,
    unitPrice: 140,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j5',
    code: '4005',
    barcode: '6221155940057',
    name: 'عصير راني حبيبات خوخ طبيعية 240 مل',
    nameEn: 'Rani Peach Float 240ml',
    shelfNumber: 'J-02-01',
    unit: 'كرتونة (24 علبة)',
    unitEn: 'Carton (24 cans)',
    availableQty: 200,
    unitPrice: 120,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j6',
    code: '4006',
    barcode: '6221155940064',
    name: 'عصير راني حبيبات أناناس حقيقية 240 مل',
    nameEn: 'Rani Pineapple Float 240ml',
    shelfNumber: 'J-02-02',
    unit: 'كرتونة (24 علبة)',
    unitEn: 'Carton (24 cans)',
    availableQty: 180,
    unitPrice: 120,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j7',
    code: '4007',
    barcode: '6221155940071',
    name: 'عصير المراعي مانجو فواكه مشكلة 1 لتر',
    nameEn: 'Almarai Mixed Mango 1L',
    shelfNumber: 'J-03-01',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 130,
    unitPrice: 150,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j8',
    code: '4008',
    barcode: '6221155940088',
    name: 'عصير المراعي رمان وتوت بري 1 لتر',
    nameEn: 'Almarai Pomegranate Berry 1L',
    shelfNumber: 'J-03-02',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 95,
    unitPrice: 155,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j9',
    code: '4009',
    barcode: '6221155940095',
    name: 'مشروب ليمون بالنعناع منعش فريش 300 مل',
    nameEn: 'Fresh Lemon Mint Drink 300ml',
    shelfNumber: 'J-03-03',
    unit: 'صندوق (24 زجاجة)',
    unitEn: 'Box (24 bottles)',
    availableQty: 150,
    unitPrice: 110,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  },
  {
    id: 'prod-j10',
    code: '4010',
    barcode: '6221155940101',
    name: 'عصير كوكتيل استوائي فواكه مشكلة 1 لتر',
    nameEn: 'Tropical Cocktail 1L',
    shelfNumber: 'J-03-04',
    unit: 'كرتونة (12 علبة)',
    unitEn: 'Carton (12 packs)',
    availableQty: 115,
    unitPrice: 140,
    defaultDiscount: 0,
    category: 'عصائر ومشروبات'
  }
];

// Rich Category Metadata and Cover Photos (for 3-in-a-row Category Grid)
export const CATEGORY_INFO: Record<string, { nameEn: string; imageUrl: string }> = {
  'شيبسي ومقرمشات': {
    nameEn: 'Chipsy & Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80'
  },
  'زيوت شل ومحركات': {
    nameEn: 'Shell Oil & Lubricants',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=600&auto=format&fit=crop&q=80'
  },
  'عصائر ومشروبات': {
    nameEn: 'Juices & Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80'
  },
  'مواد غذائية معبأة': {
    nameEn: 'Packaged Foods',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
  },
  'زيوت ودهون غذائية': {
    nameEn: 'Cooking Oils',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
  },
  'منظفات ومطهرات': {
    nameEn: 'Detergents & Cleaners',
    imageUrl: 'https://images.unsplash.com/photo-1585670270608-b4be4fb88f72?w=600&auto=format&fit=crop&q=80'
  },
  'حلويات وسكاكر': {
    nameEn: 'Sweets & Confectionery',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80'
  }
};

export function getCategoryInfo(categoryName?: string): { name: string; nameEn: string; imageUrl: string } {
  const normalized = categoryName?.trim() || 'شيبسي ومقرمشات';
  if (CATEGORY_INFO[normalized]) {
    return { name: normalized, ...CATEGORY_INFO[normalized] };
  }
  // partial keyword matching
  for (const [key, val] of Object.entries(CATEGORY_INFO)) {
    if (normalized.includes('شيبسي') || normalized.toLowerCase().includes('chipsy')) {
      return { name: 'شيبسي ومقرمشات', ...CATEGORY_INFO['شيبسي ومقرمشات'] };
    }
    if (normalized.includes('شل') || normalized.toLowerCase().includes('shell') || normalized.includes('محركات')) {
      return { name: 'زيوت شل ومحركات', ...CATEGORY_INFO['زيوت شل ومحركات'] };
    }
    if (normalized.includes('عصير') || normalized.includes('عصائر') || normalized.toLowerCase().includes('juice')) {
      return { name: 'عصائر ومشروبات', ...CATEGORY_INFO['عصائر ومشروبات'] };
    }
    if (normalized.includes('زيت') || normalized.includes('زيوت')) {
      return { name: 'زيوت ودهون غذائية', ...CATEGORY_INFO['زيوت ودهون غذائية'] };
    }
    if (normalized.includes('منظف')) {
      return { name: 'منظفات ومطهرات', ...CATEGORY_INFO['منظفات ومطهرات'] };
    }
    if (normalized.includes('حلوي') || normalized.includes('سكر')) {
      return { name: 'حلويات وسكاكر', ...CATEGORY_INFO['حلويات وسكاكر'] };
    }
  }
  return {
    name: normalized,
    nameEn: normalized,
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
  };
}

// Ensure all products have their designated image attached
MOCK_PRODUCTS.forEach((p) => {
  if (PRODUCT_IMAGES[p.code]) {
    p.imageUrl = PRODUCT_IMAGES[p.code];
  } else if (p.category === 'شيبسي ومقرمشات') {
    p.imageUrl = 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80';
  } else if (p.category === 'زيوت شل ومحركات') {
    p.imageUrl = 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=300&auto=format&fit=crop&q=80';
  } else if (p.category === 'عصائر ومشروبات') {
    p.imageUrl = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&auto=format&fit=crop&q=80';
  } else {
    p.imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80';
  }
});

/**
 * Returns the exact 35 categorized line items requested by user:
 * - 10 items for Chipsy (شيبسي ومقرمشات)
 * - 15 items for Shell Oil (زيوت شل ومحركات)
 * - 10 items for Juices (عصائر ومشروبات)
 */
export const GET_SAMPLE_CATEGORIZED_LINE_ITEMS = (): import('../types').LineItem[] => {
  const chipsyItems = MOCK_PRODUCTS.filter(p => p.category === 'شيبسي ومقرمشات').slice(0, 10);
  const shellItems = MOCK_PRODUCTS.filter(p => p.category === 'زيوت شل ومحركات').slice(0, 15);
  const juiceItems = MOCK_PRODUCTS.filter(p => p.category === 'عصائر ومشروبات').slice(0, 10);

  const allSelected = [...chipsyItems, ...shellItems, ...juiceItems];

  return allSelected.map((prod, idx) => {
    // Realistic quantities: 2 to 5 units per item
    const enteredQty = (idx % 3) + 2;
    const discount = prod.defaultDiscount || 0;
    const lineTotal = Math.max(0, Number((enteredQty * prod.unitPrice - discount).toFixed(2)));
    const catInfo = getCategoryInfo(prod.category);
    return {
      id: `sample-cat-${prod.code}-${idx}`,
      productId: prod.id,
      code: prod.code,
      name: prod.name,
      nameEn: prod.nameEn,
      shelfNumber: prod.shelfNumber,
      unit: prod.unit,
      unitEn: prod.unitEn,
      availableQty: prod.availableQty,
      enteredQty,
      unitPrice: prod.unitPrice,
      discount,
      discountType: 'fixed' as const,
      lineTotal,
      imageUrl: prod.imageUrl || PRODUCT_IMAGES[prod.code] || catInfo.imageUrl,
      category: prod.category,
      categoryImage: catInfo.imageUrl
    };
  });
};

export const GET_SAMPLE_20_LINE_ITEMS = (): import('../types').LineItem[] => {
  return GET_SAMPLE_CATEGORIZED_LINE_ITEMS();
};

export const INITIAL_ORDERS: SalesOrder[] = [
  {
    id: 'so-1',
    orderNumber: 'SO-2026-0891',
    date: '2026-09-21',
    customerId: 'cust-1',
    customerName: 'شركة الأمل لتجارة التجزئة',
    customerTaxNumber: '300124567800003',
    customerPhone: '0501234567',
    creditLimit: 50000,
    customerBranch: 'فرع المروج',
    requesterName: 'خالد عبد الله',
    requesterPhone: '0509988776',
    subCompany: 'شركة دار السلام للتجارة العامة',
    itemType: 'مواد غذائية معبأة',
    warehouse: 'المستودع الرئيسي - المنطقة الصناعية',
    salesRep: 'SA (Super Admin)',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        code: '1001',
        name: 'زيت زيتون بكر ممتاز 1 لتر',
        shelfNumber: 'A-01-03',
        unit: 'كرتونة (12 حبة)',
        availableQty: 140,
        enteredQty: 5,
        unitPrice: 320,
        discount: 16,
        discountType: 'fixed',
        lineTotal: 1584
      },
      {
        id: 'item-2',
        productId: 'prod-3',
        code: '1003',
        name: 'أرز مصري فاخر عريض الحبة 5 كجم',
        shelfNumber: 'B-02-08',
        unit: 'كيس 5 كجم',
        availableQty: 42,
        enteredQty: 10,
        unitPrice: 145,
        discount: 0,
        discountType: 'fixed',
        lineTotal: 1450
      }
    ],
    grossTotal: 3050,
    totalDiscount: 16,
    totalAfterDiscount: 3034,
    totalTax: 424.76, // 14% VAT
    totalAfterTax: 3458.76,
    withholdingTax: 30.34, // 1%
    netDue: 3428.42,
    status: 'confirmed',
    syncStatus: 'synced',
    createdAt: '2026-09-21T09:30:00Z',
    updatedAt: '2026-09-21T09:30:00Z'
  },
  {
    id: 'so-2',
    orderNumber: 'DRAFT-EDA50-1044',
    date: '2026-09-22',
    customerId: 'cust-2',
    customerName: 'مؤسسة البركة للمواد الغذائية',
    customerTaxNumber: '310987654300003',
    customerPhone: '0559876543',
    creditLimit: 30000,
    customerBranch: 'فرع الملز',
    requesterName: 'سعيد المنصور',
    requesterPhone: '0551122334',
    subCompany: 'شركة دار السلام للتجارة العامة',
    itemType: 'مواد غذائية معبأة',
    warehouse: 'مستودع التوزيع السريع - الفرع الجنوبي',
    salesRep: 'أحمد مصطفى (مندوب توزيع 1)',
    items: [
      {
        id: 'item-3',
        productId: 'prod-2',
        code: '1002',
        name: 'سكر أبيض ناعم 1 كجم',
        shelfNumber: 'B-04-12',
        unit: 'شوال (10 كجم)',
        availableQty: 85,
        enteredQty: 4,
        unitPrice: 180,
        discount: 0,
        discountType: 'fixed',
        lineTotal: 720
      }
    ],
    grossTotal: 720,
    totalDiscount: 0,
    totalAfterDiscount: 720,
    totalTax: 100.8,
    totalAfterTax: 820.8,
    withholdingTax: 7.2,
    netDue: 813.6,
    status: 'draft',
    syncStatus: 'pending',
    createdAt: '2026-09-22T08:15:00Z',
    updatedAt: '2026-09-22T08:15:00Z'
  },
  {
    id: 'so-3',
    orderNumber: 'SO-2026-0920',
    date: '2026-09-22',
    customerId: 'cust-1',
    customerName: 'شركة الأمل لتجارة التجزئة',
    customerTaxNumber: '300124567800003',
    customerPhone: '0501234567',
    creditLimit: 50000,
    customerBranch: 'فرع المروج',
    requesterName: 'خالد عبد الله',
    requesterPhone: '0509988776',
    subCompany: 'شركة دار السلام للتجارة العامة',
    itemType: 'مواد غذائية معبأة',
    warehouse: 'المستودع الرئيسي - المنطقة الصناعية',
    salesRep: 'SA (Super Admin)',
    items: GET_SAMPLE_20_LINE_ITEMS(),
    grossTotal: 5885,
    totalDiscount: 105,
    totalAfterDiscount: 5780,
    totalTax: 809.2,
    totalAfterTax: 6589.2,
    withholdingTax: 57.8,
    netDue: 6531.4,
    status: 'confirmed',
    syncStatus: 'synced',
    createdAt: '2026-09-22T10:00:00Z',
    updatedAt: '2026-09-22T10:00:00Z'
  }
];

export const INITIAL_INVOICES: SalesInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0542',
    linkedOrderNumber: 'SO-2026-0891',
    date: '2026-09-21',
    isTaxSpecific: true,
    isImmediateCash: false,
    customerId: 'cust-1',
    customerName: 'شركة الأمل لتجارة التجزئة',
    customerTaxNumber: '300124567800003',
    customerPhone: '0501234567',
    buyerName: 'خالد عبد الله',
    creditLimit: 50000,
    customerBranch: 'فرع المروج',
    subCompany: 'شركة دار السلام للتجارة العامة',
    itemType: 'مواد غذائية معبأة',
    warehouse: 'المستودع الرئيسي - المنطقة الصناعية',
    salesRep: 'SA (Super Admin)',
    items: [
      {
        id: 'inv-item-1',
        productId: 'prod-1',
        code: '1001',
        name: 'زيت زيتون بكر ممتاز 1 لتر',
        shelfNumber: 'A-01-03',
        unit: 'كرتونة (12 حبة)',
        availableQty: 140,
        enteredQty: 5,
        unitPrice: 320,
        discount: 16,
        discountType: 'fixed',
        lineTotal: 1584,
        maxReturnQty: 5
      },
      {
        id: 'inv-item-2',
        productId: 'prod-3',
        code: '1003',
        name: 'أرز مصري فاخر عريض الحبة 5 كجم',
        shelfNumber: 'B-02-08',
        unit: 'كيس 5 كجم',
        availableQty: 42,
        enteredQty: 10,
        unitPrice: 145,
        discount: 0,
        discountType: 'fixed',
        lineTotal: 1450,
        maxReturnQty: 10
      }
    ],
    grossTotal: 3050,
    totalDiscount: 16,
    totalAfterDiscount: 3034,
    totalTax: 424.76,
    totalAfterTax: 3458.76,
    withholdingTax: 30.34,
    netDue: 3428.42,
    settlementStatus: 'paid',
    syncStatus: 'synced',
    createdAt: '2026-09-21T10:15:00Z'
  }
];

export const INITIAL_POS_SALES: PosSale[] = [
  {
    id: 'pos-1',
    receiptNumber: 'POS-2026-1102',
    transactionType: 'sale',
    branch: 'الفرع الرئيسي (SA)',
    date: '2026-09-22',
    employeeName: 'SA (Super Admin)',
    warehouse: 'المستودع الرئيسي - المنطقة الصناعية',
    itemType: 'مواد غذائية معبأة',
    subCompany: 'شركة دار السلام للتجارة العامة',
    isTaxSpecific: true,
    customerId: 'cust-walkin',
    customerName: 'Walk in Customer (عميل نقدي)',
    customerCardNumber: '0',
    customerPhone: '0000000000',
    salesRep: 'SA (Super Admin)',
    items: [
      {
        id: 'pos-i-1',
        productId: 'prod-4',
        code: '1004',
        name: 'شاي أسود فاخر 100 فتلة',
        shelfNumber: 'C-01-05',
        unit: 'كرتونة (24 عبوة)',
        availableQty: 60,
        enteredQty: 1,
        unitPrice: 210,
        discount: 21,
        discountType: 'fixed',
        lineTotal: 189
      },
      {
        id: 'pos-i-2',
        productId: 'prod-5',
        code: '1005',
        name: 'مكرونة فرن إيطالية 400 جم',
        shelfNumber: 'A-03-15',
        unit: 'كرتونة (20 كيس)',
        availableQty: 95,
        enteredQty: 2,
        unitPrice: 110,
        discount: 0,
        discountType: 'fixed',
        lineTotal: 220
      }
    ],
    grossTotal: 430,
    totalDiscount: 21,
    totalTax: 57.26,
    netDue: 466.26,
    paymentMethod: 'cash',
    amountPaid: 500,
    changeDue: 33.74,
    syncStatus: 'synced',
    createdAt: '2026-09-22T07:45:00Z'
  }
];
