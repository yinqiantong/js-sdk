import {
    getUrlParam,
    delUrlParam,
    isWechat,
    isAlipay,
    isAndroid,
    isIos,
    createWxAuthRedirectUrl
} from "./utils";

const $ = require('jquery');
let YQT_WX_PAY_CONFIG;
window.YQT_CFG = {};

const showAlipayH5 = (formBody) => {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit()
};

const showDoNotSupport = (channel, platform) => {

};

const onBridgeReady = () => {
    WeixinJSBridge.invoke(
        'getBrandWCPayRequest', YQT_WX_PAY_CONFIG,
        function (res) {
            if (res.err_msg === "get_brand_wcpay_request:ok") {
            } else {
            }
        });
};

const createPayOrder = (channel, platform, money, code, error) => {
    $.post(window.YQT_CFG.orderApi, {channel, platform, money, code}, res => {
        if (res.code !== 200) {
            return error && error(res.msg)
        }
        pay(res.data)
    })
};

const config = (cfg) => {
    const {wxAppId, orderApi} = cfg;
    window.YQT_CFG = {
        wxAppId, orderApi
    };
};

const multipleQrCode = (options) => {
    let {money, code, showQrCode, createOrder, showH5PaySelector, error} = options;
    if (showQrCode) {
        showQrCode(delUrlParam(location.href, 'code'))
    }

    if (isAlipay()) {
        if (createOrder) {
            return createOrder('alipay', 'h5', money, 0)
        }
        return createPayOrder('alipay', 'h5', money, 0, error)
    }

    if (isWechat()) {
        if (!code) {
            code = getUrlParam('code')
        }
        if (!code || code === '') {
            const currHref = location.href;
            location.href = createWxAuthRedirectUrl(window.YQT_CFG.wxAppId, currHref);
            return
        }
        if (createOrder) {
            return createOrder('wx', 'mp', money, code)
        }
        return createPayOrder('wx', 'mp', money, code, error)
    }

    if (isAndroid() || isIos()) {
        if (!showH5PaySelector) {
            return error && error('showH5PaySelector 尚未配置H5支付')
        }
        return showH5PaySelector()
    }
};

const pay = (options) => {
    const {channel, /*out_trade_no,*/ platform, pay_body} = options;
    if (channel === 'alipay') {
        switch (platform) {
            case 'h5':
            case 'pc':
                showAlipayH5(pay_body);
                return
        }
    } else if (channel === 'wx') {
        switch (platform) {
            case 'h5':
                location.href = pay_body;
                return;
            case 'mp':
                YQT_WX_PAY_CONFIG = JSON.parse(pay_body);
                if (typeof WeixinJSBridge === "undefined") {
                    if (document.addEventListener) {
                        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false)
                    } else if (document.attachEvent) {
                        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady)
                    }
                } else {
                    onBridgeReady()
                }
                return
        }
    }

    showDoNotSupport(channel, platform)
};

const alipayH5 = (options) => {
    const {money, error} = options;
    createPayOrder('alipay', 'h5', money, 0, error)
};

const alipayPc = (options) => {
    const {money, error} = options;
    createPayOrder('alipay', 'pc', money, 0, error)
};

const wxpayH5 = (options) => {
    const {money, error} = options;
    createPayOrder('wx', 'h5', money, 0, error)
};

const wxpayMp = (options) => {
    const {money, code, error} = options;
    createPayOrder('wx', 'mp', money, code, error)
};

export default {
    config,
    pay,
    multipleQrCode,
    alipayH5,
    alipayPc,
    wxpayH5,
    wxpayMp
}