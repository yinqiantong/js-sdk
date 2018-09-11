function showAlipayH5(formBody) {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit();
}

function showDoNotSupport(channel, platform) {

}

export default {
    pay: function (options) {
        const {channel, out_trade_no, platform, pay_body} = options;
        if (channel === 'alipay') {
            switch (platform) {
                case 'h5':
                case 'pc':
                    showAlipayH5(pay_body);
                    return;
            }
        } else if (channel === 'wx') {
            switch (platform) {
                case 'h5':
                    return;
                case 'mp':
                    return;
            }
        }

        showDoNotSupport(channel, platform);
    }
}