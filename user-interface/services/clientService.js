const knexService = require('./knexService');

module.exports = class ClientService {
    constructor() {
        this.knex = knexService.knex;

        this.formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }

    async getStoreString() {
        let stores = await this.knex('store')
            .orderBy('id', 'asc');

        stores = stores.map(store => `ID: ${store.id}\tAddress: ${store.address}\n`);

        return stores;
    }

    async getStoreStock(store_id) {
        let stocks = await this.knex('stocks')
            .where({ store_id })
            .where('quantity', '>', 0)
            .join('product', 'product.upc_code', 'stocks.upc_code');

        let table = [];

        stocks.forEach(item => {
            table.push({
                Name: item.name,
                UPC_Code: item.upc_code,
                Cost: this.formatter.format(item.cost),
                Quantity: item.quantity,
            });
        });

        if (table.length >= 1) {
            console.table(table);
        } else {
            console.log(`Store is out of stock!`);
        }
    }

    async getStoreUPCCodes(store_id, shoppingCart) {
        let stocks = await this.knex('stocks')
            .where({ store_id })
            .where('quantity', '>', 0)
            .join('product', 'product.upc_code', 'stocks.upc_code');

        let counts = {};


        shoppingCart.forEach(item => counts[item] ? counts[item]++ : counts[item] = 1);

        Object.keys(counts).forEach(item => {
            let stockItem = stocks.find(i => i.upc_code === item);

            if (stockItem) {
                stockItem.quantity -= counts[item];
            }
        });

        stocks = stocks
            .filter(i => i.quantity >= 1)
            .map(i => ({ string: `UPC_Code: ${i.upc_code}\tName: ${i.name}`, upc: i.upc_code }));

        stocks.push({ string: 'Done adding to cart' });

        return stocks;
    }

    async printCart(cartArray, store) {
        console.log('Your cart contains the following:');

        let counts = {};

        cartArray.forEach(item => counts[item] ? counts[item]++ : counts[item] = 1);

        let names = await this.knex('product')
            .whereIn('product.upc_code', Object.keys(counts))
            .join('stocks', 'stocks.upc_code', 'product.upc_code')
            .where({ store_id: store });

        names.forEach(i => i.quantity = counts[i.upc_code]);

        names.forEach(i => {
            console.log(`Quantity: ${i.quantity}\tName: ${i.name}`);
        });

        return names;


    }

    async confirmPurchase(cartArray, meta) {

        const customer_id = meta.customer_id;
        const store_id = meta.store_id;

        let total_cost = 0;

        cartArray.forEach(i => total_cost += (i.quantity * +i.cost));

        // 1. create new order
        let order_id = (await this.knex('order')
            .insert({
                date_placed: new Date(),
                total_cost
            })
            .returning('id'))[0];


        // 2. create new customer order
        await this.knex('customer_orders').insert({ customer_id, store_id, order_id });

        let itemDecreases = [];

        // 3. Insert into order items the purchased items
        for (let i = 0; i < cartArray.length; i++) {
            const item = cartArray[i];
            await this.knex('order_items')
                .insert({
                    order_id,
                    upc_code: item.upc_code,
                    quantity: item.quantity
                });

            itemDecreases.push({ upc: item.upc_code, quantity: +item.quantity });
        }

        // decrease the count of items the store is stocking
        for (let i = 0; i < itemDecreases.length; i++) {
            const itemDecrease = itemDecreases[i];

            const currentCount = (await this.knex('stocks')
                .where({
                    store_id,
                    upc_code: itemDecrease.upc
                })
                .first())
                .quantity;

            await this.knex('stocks')
                .where({
                    store_id,
                    upc_code: itemDecrease.upc
                })
                .update({
                    quantity: +currentCount - +itemDecrease.quantity
                });

        }
    }
}