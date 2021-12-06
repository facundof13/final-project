const knexService = require('./knexService');

module.exports = class StoreService {
    constructor() {
        this.knex = knexService.knex;
    }

    async getStoreName(id) {
        let s = await this.knex('store').where({ id }).first();
        return `${s.id} - ${s.address}`;
    }

    async getVendors() {
        return (await this.knex('vendor')).map(i => i.name);
    }

    async getVendorItems(vendor_name) {
        if (!vendor_name) {
            return [];
        }

        let vends = await this.knex('vendor_carries')
            .where({ vendor_name })
            .join('product', 'product.upc_code', 'vendor_carries.upc_code');

        return vends;
    }

    async printFinishedCart(cart) {
        let totals = {};

        cart.forEach(item => totals[item.upc_code] ? totals[item.upc_code]++ : totals[item.upc_code] = 1);

        console.log('Your cart contains the following items: ');

        let arr = [];

        Object.keys(totals).forEach(i => {
            let item = cart.find(j => j.upc_code === i);
            console.log(`Quantity: ${totals[i]}\tName: ${item.name}`);
            arr.push({
                quantity: totals[i],
                name: item.name,
                upc_code: i,
                cost: item.cost
            });
        });

        return arr;
    }

    async confirmOrder(cart, store_id, vendor_name) {
        let total_cost = 0;

        cart.forEach(i => total_cost += (i.quantity * +i.cost));

        // 1. create new order 
        let order_id = (await this.knex('order')
            .insert({
                date_placed: new Date(),
                total_cost
            })
            .returning('id'))[0];

        // 2. create new store order
        await this.knex('store_orders')
            .insert({ order_id, store_id, vendor_name });

        for (let i = 0; i < cart.length; i++) {
            const cartItem = cart[i];

            // 3. insert into order_items all the purchased items
            await this.knex('order_items')
                .insert({ order_id, upc_code: cartItem.upc_code, quantity: cartItem.quantity });

            // 4. update store stocks
            let currentAmt = await this.knex('stocks')
                .where({ store_id, upc_code: cartItem.upc_code })
                .first();

            if (currentAmt) {
                await this.knex('stocks')
                    .where({ store_id, upc_code: cartItem.upc_code })
                    .update({ quantity: currentAmt.quantity + cartItem.quantity });
            } else {
                await this.knex('stocks')
                    .insert({
                        store_id,
                        upc_code: cartItem.upc_code,
                        quantity: cartItem.quantity,
                        cost: +cartItem.cost * 1.20
                    })
            }
        }



    }
}