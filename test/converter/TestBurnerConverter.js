const BurnerConverter = artifacts.require('BurnerConverter');
const TestToken = artifacts.require('TestTokenBurner');
const DummyConverter = artifacts.require('DummyConverter');

const {
    bn,
    tryCatchRevert,
    toEvents,
    expect,
    increaseTime,
    address0x,
    getTxTime,
} = require('../Helper.js');

function toWei (stringNumber) {
    return bn(stringNumber).mul(bn(10).pow(bn(18)));
}

function toDecimals (stringNumber, decimals) {
    return bn(stringNumber).mul(bn(10).pow(bn(decimals)));
}

contract('Burner Contract', function (accounts) {
    const owner = accounts[0];

    let burnT;
    let soldT;
    let burnerConverter;
    let converter;

    const WEI = bn(web3.utils.toWei('1'));
    const tokensBase = WEI.mul(WEI);

    before('Deploy contracts', async function () {
        burnT = await TestToken.new('BURNT', 'Burn token', '18', { from: owner });
        soldT = await TestToken.new('SOLDT', 'Sold Token', '6', { from: owner });

        converter = await DummyConverter.new();

        burnerConverter = await BurnerConverter.new(burnT.address, converter.address, { from: owner });
        await burnT.setBalance(converter.address, toWei(bn(10000000)));
    });

    // Test Set converter function
    describe('Function setConverter', function () {
        it('Should set the converter', async function () {
            const newConverter = accounts[6];

            const SetConverter = await toEvents(
                burnerConverter.setConverter(
                    newConverter,
                    { from: accounts[0] }
                ),
                'SetConverter'
            );

            assert.equal(SetConverter._converter, newConverter);
            assert.equal(await burnerConverter.converter(), newConverter);

            await burnerConverter.setConverter(converter.address, { from: accounts[0] });
        });
        it('Try set address 0x0 as converter', async function () {
            await tryCatchRevert(
                () => burnerConverter.setConverter(
                    address0x,
                    { from: accounts[0] }
                ),
                'Converter 0x0 is not valid'
            );
        });
        it('Try set converter without ownership', async function () {
            await tryCatchRevert(
                () => burnerConverter.setConverter(
                    accounts[1],
                    { from: accounts[1] }
                ),
                ''
            );
        });
    });

    // Test getters function
    describe('Test getters ', async function () {
        it('', async function () {

        });
    });

    // Test executeBurning function
    describe('executeBurning function', async function () {
        it('', async function () {
            await soldT.setBalance(owner, toDecimals('10000000', '6'));
        });
    });

});