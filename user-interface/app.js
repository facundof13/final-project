const rl = require('readline-sync');
const ClientService = require('./services/clientService');
const CustomerService = require('./services/customerService');
const StoreService = require('./services/storeService');
const Strings = require('./strings');
const { exit } = require('process');
const clientService = new ClientService();
const customerService = new CustomerService();
const storeService = new StoreService();
const _ = require('lodash');

let selectedCustomer = { id: null };
let selectedStore;
let isStoreOrder;


acceptInput = async (input) => {
    switch (input) {
        case 0:
        case 1:
            const storeString = await clientService.getStoreString();

            console.log('Select a store: ');
            selectedStore = rl.keyInSelect(storeString);
            isStoreOrder = input === 1;

            if (!isStoreOrder) {
                selectedCustomer.id = null;
            }
            break;
        case -1:
        default:
            exit(0);
    }


    await main();
}

acceptStoreInput = async (input) => {

    let clearInput = true;

    switch (input) {
        case 0:
            await clientService.getStoreStock(selectedStore + 1);
            clearInput = false;
            break;
        case 1:
            let shoppingCart = [];

            let upcCodes = await clientService.getStoreUPCCodes(selectedStore + 1, shoppingCart);

            let selected = rl.keyInSelect(upcCodes.map(i => i.string));

            while (selected !== -1) {
                if (selected + 1 === upcCodes.length) {
                    break;
                } else {
                    shoppingCart.push(upcCodes[selected].upc);

                    console.log(`Shopping cart contains ${shoppingCart.length} item(s).`);

                    upcCodes = await clientService.getStoreUPCCodes(selectedStore + 1, shoppingCart);
                }

                selected = rl.keyInSelect(upcCodes.map(i => i.string));
            }

            if (shoppingCart.length >= 1) {

                let metaObj = { store_id: selectedStore + 1, customer_id: selectedCustomer.id };

                let finishedCart = await clientService.printCart(shoppingCart, selectedStore + 1);

                if (rl.keyInYN('Confirm cart?')) {
                    await clientService.confirmPurchase(finishedCart, metaObj);

                    console.log('Order completed! Thank you :)');
                    clearInput = false;
                }

                selectedStore = null;
                selectedCustomer.id = null;
            }

            shoppingCart = [];
            break;
        case -1:
        default:
            selectedStore = null;
            break;
    }

    await main(clearInput);

}

acceptStoreOrderInput = async (input) => {
    console.log(input);
}

main = async (clearConsole = true) => {
    if (clearConsole) {
        console.clear();
    }

    if (!_.isNil(selectedStore) && selectedStore >= 0 && !isStoreOrder) {

        if (_.isNil(selectedCustomer.id)) {
            selectedCustomer.id = rl.questionInt('Enter your customer ID: ');

            if (selectedCustomer.id <= 0 || !(await customerService.customerIsValid(selectedCustomer.id))) {
                selectedCustomer.id = null;
            } else {
                selectedCustomer.name = await customerService.getCustomerName(selectedCustomer.id);
            }


            await main();
        } else {
            console.log(`\nWelcome, ${selectedCustomer.name}`);
            console.log(`You are shopping at store ${await storeService.getStoreName(selectedStore + 1)}`);
            acceptStoreInput(rl.keyInSelect(Strings.storeOptions));
        }
    } else if (isStoreOrder && !_.isNil(selectedStore) && selectedStore >= 0) {

        let clear = true;

        console.log('Select a vendor to purchase from: ');
        const vendors = await storeService.getVendors();
        const vendor = vendors[rl.keyInSelect(vendors)];

        if (!vendor) {
            selectedStore = null;
            await main();
        }

        console.clear();

        let storeCart = [];
        let vendorItems = await storeService.getVendorItems(vendor);
        console.log('Select items to add to your cart');

        let options = vendorItems.map(i => `Name: ${i.name} Cost: ${i.cost} UPC_Code: ${i.upc_code}`);

        options.push('Done selecting items');

        let selectedItem = rl.keyInSelect(options);

        while (selectedItem !== -1) {

            if (selectedItem === vendorItems.length) {
                let finalCart = await storeService.printFinishedCart(storeCart);

                if (rl.keyInYN('Confirm cart?')) {
                    await storeService.confirmOrder(finalCart, selectedStore + 1, vendor);

                    console.log('Thank you for you order! Your store has been restocked');

                    clear = false;
                }
                break;
            } else {
                storeCart.push(vendorItems[selectedItem]);
                console.log(`You have ${storeCart.length} item(s) in your cart.`);
                selectedItem = rl.keyInSelect(options);
            }
        }

        await main(clear);
    } else {
        // isStoreOrder = true;
        await acceptInput(rl.keyInSelect(Strings.mainOptions));
    }
}


main().then();