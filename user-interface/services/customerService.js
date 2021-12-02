const knexService = require('../knexService');

module.exports = class CustomerService {
    constructor() {
        this.knex = knexService.knex;
    }

    async getCustomers() {
        let customers = await this.knex('customer').select('id', 'first_name', 'last_name');
        return customers;
    }

    async selectCustomer() {

    }

    async customerIsValid(id) {
        return await this.knex('customer').where({ id }).first() ? true : false;
    }

    async getCustomerName(id) {
        let c = (await this.knex('customer').where({ id }).first());

        return `${c.first_name} ${c.last_name}`;
    }
}