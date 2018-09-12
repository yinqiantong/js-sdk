import {
    getUrlParam,
    delUrlParam,
    isWechat,
    isAlipay,
    isAndroid,
    isIos,
    createWxAuthRedirectUrl
} from "./utils";

let payConfig;

function showAlipayH5(formBody) {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit();
}

function showDoNotSupport(channel, platform) {

}

function onBridgeReady() {
    WeixinJSBridge.invoke(
        'getBrandWCPayRequest', payConfig,
        function (res) {
            alert(JSON.stringify(res));
            if (res.err_msg === "get_brand_wcpay_request:ok") {
                // 使用以上方式判断前端返回,微信团队郑重提示：
                //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
            } else {
                $dialogMsg.html('支付失败');
                $dialog.fadeIn(200)
            }
        });
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
                    location.href = pay_body;
                    return;
                case 'mp':
                    payConfig = JSON.parse(pay_body);
                    if (typeof WeixinJSBridge === "undefined") {
                        if (document.addEventListener) {
                            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
                        } else if (document.attachEvent) {
                            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
                        }
                    } else {
                        onBridgeReady();
                    }
                    return;
            }
        }

        showDoNotSupport(channel, platform);
    }
}