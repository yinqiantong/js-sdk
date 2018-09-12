import {
    getUrlParam,
    delUrlParam,
    isWechat,
    isAlipay,
    isAndroid,
    isIos,
    createWxAuthRedirectUrl
} from "./utils";

function showAlipayH5(formBody) {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit();
}

function showDoNotSupport(channel, platform) {

}

export default {
    multipleQrCode: function ({money, wxAppId, showQrCode, createOrder, showH5PaySelector, error}) {
        if (showQrCode) {
            showQrCode(delUrlParam(location.href, 'code'))
        }

        if (isAlipay()) {
            if (!createOrder) {
                return error && error('createOrder 尚未配置，暂不支持支付宝')
            }
            return createOrder('alipay', 'h5', money, 0)
        }

        if (isWechat()) {
            const code = getUrlParam('code');
            if (!code || code === '') {
                const currHref = location.href;
                location.href = createWxAuthRedirectUrl(wxAppId, currHref);
                return
            }
            if (!createOrder) {
                return error && error('createOrder 尚未配置，暂不支持微信')
            }
            return createOrder('wx', 'mp', money, code)
        }

        if (isAndroid() || isIos()) {
            if (!showH5PaySelector) {
                return error && error('showH5PaySelector 尚未配置H5支付')
            }
            return showH5PaySelector()
        }
    },
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
                    alert('微信h5');
                    return;
                case 'mp':
                    alert('微信公众号');
                    return;
            }
        }

        showDoNotSupport(channel, platform);
    }
}