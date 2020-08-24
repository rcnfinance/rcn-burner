const BurnerConverter = artifacts.require('BurnerConverter');
const TestToken = artifacts.require('TestTokenBurner');
const WETH9 = artifacts.require('WETH9');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router = artifacts.require('UniswapV2Router02');
const UniswapV2Converter = artifacts.require('UniswapV2Converter');

const {
    bn,
    toEvents,
    expect,
} = require('../Helper.js');
// const { assert } = require('chai');
// const Snap = require('./common/balanceSnap.js');

function toDec (stringNumber, decimals) {
    return bn(stringNumber).mul(bn(10).pow(bn(decimals)));
}

contract('BurnerConverter with Uniswap V2', function (accounts) {
    const owner = accounts[1];

    let burnT;
    let soldT;
    let uniswapV2Factory;
    let uniswapV2Converter;
    let router;
    let weth;
    let burnerConverter;

    async function addLiquidity (tokenA, tokenB, amountA, amountB) {
        await tokenA.setBalance(owner, amountA);
        await tokenA.approve(router.address, amountA, { from: owner });
        await tokenB.setBalance(owner, amountB);
        await tokenB.approve(router.address, amountB, { from: owner });

        await router.addLiquidity(
            tokenA.address,
            tokenB.address,
            amountA,
            amountB,
            1,
            1,
            owner,
            bn('999999999999999999999999999999'),
            { from: owner }
        );
    }

    async function addLiquidityETH (tokenA, amountETH, amountA) {
        await tokenA.setBalance(owner, amountA);
        await tokenA.approve(router.address, amountA, { from: owner });

        await router.addLiquidityETH(
            tokenA.address,
            amountA,
            1,
            1,
            owner,
            '9999999999999999999999999999999',
            { from: owner, value: amountETH }
        );
    }

    before('Deploy RCN contracts', async () => {
        // Deploy DEST and TEST tokens
        soldT = await TestToken.new('SOLDT', 'Sold Token', '6', { from: owner });
        burnT = await TestToken.new('BURNT', 'Burn token', '18', { from: owner });

        // Deploy WETH
        weth = await WETH9.new();

        // Deploy Uniswap V2
        uniswapV2Factory = await UniswapV2Factory.new(owner);
        router = await UniswapV2Router.new(uniswapV2Factory.address, weth.address);
        // Add liquidity
        await addLiquidity(soldT, burnT, toDec('50000', '6'), toDec('1000000', '18'));
        await addLiquidityETH(soldT, toDec('100', '18'), toDec('40000', '6'));
        await addLiquidityETH(burnT, toDec('100', '18'), toDec('550000', '18'));

        // Deploy converter ramp
        uniswapV2Converter = await UniswapV2Converter.new(router.address);
        burnerConverter = await BurnerConverter.new(burnT.address, uniswapV2Converter.address, { from: owner });
    });

    it('Should convert tokens using uniswapV2 and burn received', async function () {
        await soldT.setBalance(burnerConverter.address, toDec('1000', '6'));
        const soldAmount = await burnerConverter.getSoldTBalance(soldT.address);
        const expectedReceived = await burnerConverter.getPriceConvertFrom(soldT.address, burnT.address, soldAmount);
        const minReceived = bn(expectedReceived).mul(bn(997)).div(bn(1000));

        const BurnTokens = await toEvents(
            burnerConverter.executeBurning(
                soldT.address,
                soldAmount,
                minReceived,
                { from: owner }
            ),
            'BurnTokens'
        );

        assert.equal(BurnTokens._soldToken, soldT.address);
        expect(BurnTokens._soldAmount).to.eq.BN(soldAmount);
        expect(BurnTokens._burnAmount).to.eq.BN(expectedReceived);
    });
});
