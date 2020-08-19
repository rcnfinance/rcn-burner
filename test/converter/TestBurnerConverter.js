const BurnerConverter = artifacts.require('BurnerConverter');
const TestToken = artifacts.require('TestTokenBurner');
const FakeConverter = artifacts.require('FakeConverter');

const {
    bn,
    tryCatchRevert,
    toEvents,
    expect,
    address0x,
} = require('../Helper.js');

function toWei (stringNumber) {
    return bn(stringNumber).mul(bn(10).pow(bn(18)));
}

function toDecimals (stringNumber, decimals) {
    return bn(stringNumber).mul(bn(10).pow(bn(decimals)));
}

function getAmountB (amountA, reserveA, reserveB) {
    return bn(amountA).mul(bn(reserveB)).div(bn(reserveA));
};

contract('Burner Contract', function (accounts) {
    const owner = accounts[0];

    let burnT;
    let soldT;
    let burnerConverter;
    let converter;

    before('Deploy contracts', async function () {
        burnT = await TestToken.new('BURNT', 'Burn token', '18', { from: owner });
        soldT = await TestToken.new('SOLDT', 'Sold Token', '6', { from: owner });

        converter = await FakeConverter.new();

        burnerConverter = await BurnerConverter.new(burnT.address, converter.address, { from: owner });
        await burnT.setBalance(converter.address, toWei(bn(10000000)));

        // reserveA Token soldT price 0.05 burnT
        const reserveA = toDecimals('5', '6');
        const reserveB = toDecimals('100', '18');
        await converter.setReserves(reserveA, reserveB);
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
        it('getPriceConvertFrom function', async function () {
            // reserveA Token soldT price 0.07 burnT
            const reserveA = toDecimals('7', '6');
            const reserveB = toDecimals('100', '18');

            await converter.setReserves(reserveA, reserveB);
            const fromAmount = toDecimals('10', '6');

            const toAmount = await burnerConverter.getPriceConvertFrom(soldT.address, burnT.address, fromAmount);
            const expectedToAmount = getAmountB(fromAmount, reserveA, reserveB);
            expect(toAmount).to.eq.BN(expectedToAmount);
        });
        it('getSoldTBalance function', async function () {
            const balance = await soldT.balanceOf(burnerConverter.address);
            const burnerBalance = await burnerConverter.getSoldTBalance(soldT.address);
            expect(balance).to.eq.BN(burnerBalance);
        });
    });

    // Test executeBurning function
    describe('executeBurning function', async function () {
        it('Should convert tokens and burn received', async function () {
            await soldT.setBalance(burnerConverter.address, toDecimals('1000', '6'));
            const soldAmount = await burnerConverter.getSoldTBalance(soldT.address);
            const expectedReceived = await burnerConverter.getPriceConvertFrom(soldT.address, burnT.address, soldAmount);
            const minReceived = bn(expectedReceived).mul(bn(997)).div(bn(1000));

            const BurnTokens = await toEvents(
                burnerConverter.executeBurning(
                    soldT.address,
                    soldAmount,
                    minReceived,
                    { from: accounts[0] }
                ),
                'BurnTokens'
            );

            assert.equal(BurnTokens._soldToken, soldT.address);
            expect(BurnTokens._soldAmount).to.eq.BN(soldAmount);
            expect(BurnTokens._burnAmount).to.eq.BN(expectedReceived);
        });
        it('Should revert if converted received amount is less than min received', async function () {
            await soldT.setBalance(burnerConverter.address, toDecimals('2000', '6'));
            const soldAmount = await burnerConverter.getSoldTBalance(soldT.address);
            const expectedReceived = await burnerConverter.getPriceConvertFrom(soldT.address, burnT.address, soldAmount);
            const minReceived = bn(expectedReceived).mul(bn(1005)).div(bn(1000));

            await tryCatchRevert(
                () => burnerConverter.executeBurning(
                    soldT.address,
                    soldAmount,
                    minReceived,
                    { from: accounts[0] }
                ),
                'BurnerConverter/Amount received is less than minReceived'
            );
        });
        it('Only owner can call executeBurning function', async function () {
            await soldT.setBalance(burnerConverter.address, toDecimals('1500', '6'));
            const soldAmount = await burnerConverter.getSoldTBalance(soldT.address);
            const expectedReceived = await burnerConverter.getPriceConvertFrom(soldT.address, burnT.address, soldAmount);
            const minReceived = bn(expectedReceived).mul(bn(997)).div(bn(1000));

            await tryCatchRevert(
                () => burnerConverter.executeBurning(
                    soldT.address,
                    soldAmount,
                    minReceived,
                    { from: accounts[1] }
                ),
                'Ownable: caller is not the owner'
            );
        });
    });
});
