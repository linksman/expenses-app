import { Expense, RateSnapshot } from '../types/expense';
import { PaymentMethod } from '../types/paymentMethod';
import { Vacation } from '../types/vacation';

// Stable IDs make the coffee-button import safe to run repeatedly: demo rows
// are refreshed in place instead of being duplicated.
export const DEMO_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'demo-apple-pay', name: 'Apple Pay', icon: 'logo-apple', enabled: true },
  { id: 'demo-travel-card', name: 'Travel Card', icon: 'airplane-outline', enabled: true },
  { id: 'demo-paypal', name: 'PayPal', icon: 'logo-paypal', enabled: true },
];

export const DEMO_VACATIONS: Vacation[] = [
  {
    id: 'demo-vacation-tokyo', name: 'Tokyo Adventure', createdAt: '2026-03-01T09:00:00.000Z',
    currencies: [{ code: 'JPY', isDefault: true }, { code: 'USD', isDefault: false, fixedRate: 1 }],
    leadCurrency: 'USD', groupBy: 'date',
    companions: [{ id: 'demo-tokyo-maya', name: 'Maya' }, { id: 'demo-tokyo-noam', name: 'Noam' }, { id: 'demo-tokyo-lior', name: 'Lior' }],
  },
  {
    id: 'demo-vacation-italy', name: 'Italian Summer', createdAt: '2026-04-01T09:00:00.000Z',
    currencies: [{ code: 'EUR', isDefault: true }, { code: 'USD', isDefault: false, fixedRate: 0.92 }, { code: 'GBP', isDefault: false, fixedRate: 1.17 }],
    leadCurrency: 'EUR', groupBy: 'category',
    companions: [{ id: 'demo-italy-dana', name: 'Dana' }, { id: 'demo-italy-ron', name: 'Ron' }],
  },
  {
    id: 'demo-vacation-new-york', name: 'New York Weekend', createdAt: '2026-05-01T09:00:00.000Z',
    currencies: [{ code: 'USD', isDefault: true }, { code: 'EUR', isDefault: false, fixedRate: 1.09 }],
    leadCurrency: 'USD', groupBy: 'paymentMethod',
    companions: [{ id: 'demo-ny-ella', name: 'Ella' }, { id: 'demo-ny-amit', name: 'Amit' }, { id: 'demo-ny-yuval', name: 'Yuval' }, { id: 'demo-ny-tal', name: 'Tal' }],
  },
  {
    id: 'demo-vacation-thailand', name: 'Thailand Escape', createdAt: '2026-06-01T09:00:00.000Z',
    currencies: [{ code: 'THB', isDefault: true }, { code: 'USD', isDefault: false, fixedRate: 1 }, { code: 'EUR', isDefault: false, fixedRate: 1.087 }],
    leadCurrency: 'USD', groupBy: 'collaborators',
    companions: [{ id: 'demo-thai-shira', name: 'Shira' }, { id: 'demo-thai-omer', name: 'Omer' }, { id: 'demo-thai-gal', name: 'Gal' }],
  },
  {
    id: 'demo-vacation-london', name: 'London City Break', createdAt: '2026-07-01T09:00:00.000Z',
    currencies: [{ code: 'GBP', isDefault: true }, { code: 'EUR', isDefault: false, fixedRate: 0.86 }, { code: 'USD', isDefault: false, fixedRate: 0.78 }],
    leadCurrency: 'GBP', groupBy: 'currency',
    companions: [{ id: 'demo-london-neta', name: 'Neta' }, { id: 'demo-london-avi', name: 'Avi' }],
  },
];

const DEMO_RATES: RateSnapshot = {
  base: 'USD', fetchedAt: Date.parse('2026-01-01T00:00:00.000Z'),
  rates: { USD: 1, EUR: 0.92, GBP: 0.78, JPY: 150, THB: 35.5, ILS: 3.65, CAD: 1.36, AUD: 1.52, CHF: 0.88 },
};

type ExpenseSeed = [
  amount: number,
  category: Expense['category'],
  description: string,
  currencyCode: string,
  paymentMethodId: string,
  createdAt: string,
  split: Array<[companionId: string, amount: number]>,
  excludedFromStatistics?: boolean,
];

const seeds: Record<string, ExpenseSeed[]> = {
  'demo-vacation-tokyo': [
    [4200,'Transport','Airport train','JPY','demo-travel-card','2026-03-05T08:20:00.000Z',[]],
    [12800,'Food','Sushi dinner','JPY','demo-apple-pay','2026-03-05T19:30:00.000Z',[['demo-tokyo-maya',4200],['demo-tokyo-noam',4200]]],
    [186,'Lodging','Shinjuku hotel deposit','USD','credit-card','2026-03-06T10:00:00.000Z',[['demo-tokyo-maya',62],['demo-tokyo-noam',62]]],
    [2400,'Activities','TeamLab ticket','JPY','demo-apple-pay','2026-03-07T11:15:00.000Z',[]],
    [980,'Food','Ramen lunch','JPY','cash','2026-03-07T13:10:00.000Z',[['demo-tokyo-lior',490]]],
    [6500,'Shopping','Vintage market','JPY','demo-paypal','2026-03-08T15:40:00.000Z',[]],
    [3100,'Groceries','Convenience store supplies','JPY','cash','2026-03-09T09:05:00.000Z',[['demo-tokyo-maya',775],['demo-tokyo-noam',775],['demo-tokyo-lior',775]]],
    [52,'Entertainment','Karaoke room','USD','credit-card','2026-03-10T21:20:00.000Z',[['demo-tokyo-noam',26]]],
    [1700,'Transport','Metro cards','JPY','demo-travel-card','2026-03-11T08:00:00.000Z',[]],
    [5600,'Activities','Mount Fuji day trip','JPY','credit-card','2026-03-12T07:30:00.000Z',[['demo-tokyo-maya',1400],['demo-tokyo-noam',1400],['demo-tokyo-lior',1400]]],
  ],
  'demo-vacation-italy': [
    [74,'Transport','Train to Florence','EUR','demo-travel-card','2026-04-12T07:45:00.000Z',[['demo-italy-dana',37]]],
    [28,'Food','Pizza and spritz','EUR','cash','2026-04-12T19:15:00.000Z',[]],
    [210,'Lodging','Tuscan guesthouse','EUR','credit-card','2026-04-13T14:00:00.000Z',[['demo-italy-dana',70],['demo-italy-ron',70]]],
    [36,'Activities','Uffizi tickets','EUR','demo-apple-pay','2026-04-14T10:30:00.000Z',[['demo-italy-ron',18]]],
    [22,'Groceries','Market picnic','EUR','cash','2026-04-14T12:20:00.000Z',[['demo-italy-dana',11]]],
    [95,'Shopping','Leather bag','EUR','demo-paypal','2026-04-15T16:10:00.000Z',[]],
    [48,'Food','Pasta class dinner','GBP','credit-card','2026-04-16T18:00:00.000Z',[['demo-italy-dana',16],['demo-italy-ron',16]]],
    [18,'Transport','Vespa fuel','EUR','cash','2026-04-17T09:00:00.000Z',[['demo-italy-ron',9]]],
    [64,'Activities','Vineyard tasting','USD','demo-travel-card','2026-04-18T14:30:00.000Z',[['demo-italy-dana',32]]],
    [14,'Other','City tax','EUR','cash','2026-04-19T08:00:00.000Z',[]],
  ],
  'demo-vacation-new-york': [
    [65,'Transport','Airport taxi','USD','credit-card','2026-05-08T15:10:00.000Z',[['demo-ny-ella',13],['demo-ny-amit',13],['demo-ny-yuval',13],['demo-ny-tal',13]]],
    [145,'Lodging','Brooklyn apartment','USD','demo-paypal','2026-05-08T17:00:00.000Z',[['demo-ny-ella',29],['demo-ny-amit',29],['demo-ny-yuval',29],['demo-ny-tal',29]]],
    [34,'Food','Deli breakfast','USD','demo-apple-pay','2026-05-09T09:15:00.000Z',[['demo-ny-ella',17]]],
    [92,'Activities','Broadway balcony seats','USD','credit-card','2026-05-09T19:30:00.000Z',[]],
    [41,'Shopping','SoHo souvenirs','EUR','demo-travel-card','2026-05-10T13:40:00.000Z',[]],
    [27,'Groceries','Picnic in Central Park','USD','cash','2026-05-10T15:00:00.000Z',[['demo-ny-amit',9],['demo-ny-tal',9]]],
    [58,'Entertainment','Jazz club','USD','demo-apple-pay','2026-05-10T21:45:00.000Z',[['demo-ny-yuval',29]]],
    [16,'Transport','Subway passes','USD','demo-travel-card','2026-05-11T08:30:00.000Z',[]],
    [76,'Food','Rooftop dinner','USD','credit-card','2026-05-11T20:00:00.000Z',[['demo-ny-ella',19],['demo-ny-amit',19],['demo-ny-yuval',19]]],
    [24,'Other','Luggage storage','USD','cash','2026-05-12T11:00:00.000Z',[['demo-ny-tal',12]]],
  ],
  'demo-vacation-thailand': [
    [920,'Transport','Ferry and taxi','THB','cash','2026-06-16T06:50:00.000Z',[['demo-thai-shira',230],['demo-thai-omer',230],['demo-thai-gal',230]]],
    [2100,'Lodging','Beach bungalow','THB','credit-card','2026-06-16T14:00:00.000Z',[['demo-thai-shira',700],['demo-thai-omer',700]]],
    [480,'Food','Night market dinner','THB','cash','2026-06-16T20:15:00.000Z',[['demo-thai-gal',160]]],
    [38,'Activities','Diving lesson','USD','demo-travel-card','2026-06-17T08:00:00.000Z',[['demo-thai-shira',19]]],
    [760,'Activities','Temple tour','THB','demo-apple-pay','2026-06-18T09:30:00.000Z',[['demo-thai-omer',190],['demo-thai-gal',190]]],
    [350,'Groceries','Fruit and water','THB','cash','2026-06-18T12:30:00.000Z',[]],
    [42,'Shopping','Handmade crafts','EUR','demo-paypal','2026-06-19T16:00:00.000Z',[]],
    [1250,'Entertainment','Muay Thai event','THB','credit-card','2026-06-19T19:30:00.000Z',[['demo-thai-shira',312.5],['demo-thai-omer',312.5],['demo-thai-gal',312.5]]],
    [680,'Food','Seafood lunch','THB','demo-apple-pay','2026-06-20T13:00:00.000Z',[['demo-thai-omer',340]]],
    [300,'Other','Laundry service','THB','cash','2026-06-21T10:00:00.000Z',[]],
  ],
  'demo-vacation-london': [
    [24,'Transport','Heathrow Express','GBP','demo-travel-card','2026-07-09T09:00:00.000Z',[['demo-london-neta',12]]],
    [168,'Lodging','Notting Hill hotel','GBP','credit-card','2026-07-09T15:00:00.000Z',[['demo-london-neta',56],['demo-london-avi',56]]],
    [31,'Food','Pub dinner','GBP','demo-apple-pay','2026-07-09T20:00:00.000Z',[['demo-london-avi',15.5]]],
    [54,'Activities','Tower of London','GBP','credit-card','2026-07-10T10:00:00.000Z',[['demo-london-neta',18],['demo-london-avi',18]]],
    [19,'Groceries','Breakfast supplies','GBP','cash','2026-07-10T17:30:00.000Z',[]],
    [73,'Shopping','Camden Market finds','EUR','demo-paypal','2026-07-11T13:45:00.000Z',[]],
    [88,'Entertainment','West End musical','USD','credit-card','2026-07-11T19:00:00.000Z',[['demo-london-neta',44]]],
    [15,'Transport','Oyster top-up','GBP','demo-travel-card','2026-07-12T08:20:00.000Z',[]],
    [46,'Food','Afternoon tea','GBP','demo-apple-pay','2026-07-12T15:00:00.000Z',[['demo-london-neta',15.33],['demo-london-avi',15.33]]],
    [12,'Other','Museum donation','GBP','cash','2026-07-13T11:30:00.000Z',[],true],
  ],
};

// Tuple notation above keeps the fixture readable; convert it once into the
// same object shape used by persisted expenses.
export const DEMO_EXPENSES: Expense[] = Object.entries(seeds).flatMap(
  ([vacationId, vacationSeeds]) => vacationSeeds.map((tuple, index) => {
    return {
      id: `${vacationId}-expense-${index + 1}`,
      vacationId,
      amount: tuple[0], category: tuple[1], description: tuple[2], currencyCode: tuple[3],
      paymentMethodId: tuple[4], createdAt: tuple[5],
      split: tuple[6].map(([companionId, amount]) => ({ companionId, amount })),
      excludedFromStatistics: tuple[7] ?? false,
      rateSnapshot: DEMO_RATES,
    };
  })
);
