const BurnerBridge = artifacts.require('BurnerBridge');
const TestToken = artifacts.require('TestTokenBurner');

const {
    bn,
    toEvents,
    expect,
} = require('./Helper.js');

function toDecimals (stringNumber, decimals) {
    return bn(stringNumber).mul(bn(10).pow(bn(decimals)));
}

contract('Burner Bridge Contract', function (accounts) {
    const owner = accounts[0];

    let baseToken;
    let burnerBridge;

    before('Deploy contracts', async function () {
        baseToken = await TestToken.new('baseToken', 'baseToken', '6', { from: owner });

        burnerBridge = await BurnerBridge.new({ from: owner });
        await baseToken.setBalance(owner, toDecimals('10000', '6'));
    });

    describe('WithdrawTokens ', async function () {
        it('Should withdraw tokens from burner', async function () {
            const amount = toDecimals('500', '6');
            await baseToken.setBalance(burnerBridge.address, amount);

            const prevOwnerBalance = await baseToken.balanceOf(owner);

            const withdrawAmount = await toEvents(
                burnerBridge.withdrawToken(
                    baseToken.address,
                    owner,
                    amount,
                    { from: owner }
                ),
                'Withdraw'
            );

            const ownerBalance = await baseToken.balanceOf(owner);
            expect(ownerBalance).to.eq.BN((prevOwnerBalance).add(withdrawAmount._amount));
        });
    });
});
