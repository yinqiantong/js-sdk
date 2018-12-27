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

const showAlipayH5 = formBody => {
    const element = document.createElement('div');
    element.innerHTML = formBody;
    document.body.appendChild(element);
    document.forms['alipaysubmit'].submit()
};

const createPayOrder = (url, type, data, channel, platform, code, error) => {
    if (!type) {
        type = 'POST'
    }
    $.ajax({
        url,
        type,
        data: {channel, platform, code, data},
        success: res => {
            if (res.code !== 200) {
                return error && error(res.msg)
            }
            pay(channel, platform, res.data.pay_body);
        },
        error: () => {
            return error && error(res.msg)
        }
    });
};

const getOrder = (url, outTradeNo, type, success, error) => {
    if (!type) {
        type = 'POST'
    }
    $.ajax({
        url,
        type,
        data: {out_trade_no: outTradeNo},
        success: res => {
            if (res.code !== 200) {
                return error && error(res.msg)
            }
            success(res.data)
        },
        error: () => {
            return error && error(res.msg)
        }
    })
};

const isPaySuccess = (order) => {
    return order && order.status && order.status === 'pay_success'
};

const multipleQrCode = options => {
    let {url, type, data, wxAppId, code, showQrCode, showH5PaySelector, error} = options;
    if (showQrCode) {
        showQrCode(delUrlParam(location.href, 'code'))
    }

    if (isAlipay()) {
        return createPayOrder(url, type, data, 1, 3, 0, error)
    }

    if (isWechat()) {
        if (!code) {
            code = getUrlParam('code')
        }
        if (!code || code === '') {
            const currHref = location.href;
            location.href = createWxAuthRedirectUrl(wxAppId, currHref);
            return
        }
        return createPayOrder(url, type, data, 2, 4, code, error)
    }

    if (isAndroid() || isIos()) {
        if (!showH5PaySelector) {
            return error && error('selector not found')
        }
        return showH5PaySelector()
    }
};

const pay = (channel, platform, pay_body) => {

    function onBridgeReady() {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', JSON.parse(pay_body),
            function (res) {
                if (res.err_msg === "get_brand_wcpay_request:ok") {
                } else {
                }
            });
    }

    if (channel === 1) {
        switch (platform) {
            case 3:
            case 1:
                showAlipayH5(pay_body);
                return true;
        }
    } else if (channel === 2) {
        switch (platform) {
            case 3:
                location.href = pay_body;
                return true;
            case 4:
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
                return true;
        }
    }

    console.error(`Unsupported ${channel} ${platform} ${pay_body}`);
    return false;
};

const alipayH5 = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, 1, 3, 0, error)
};

const alipayPc = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, 1, 1, 0, error)
};

const wxpayH5 = options => {
    const {url, type, data, error} = options;
    createPayOrder(url, type, data, 2, 3, 0, error)
};

const wxpayMp = options => {
    const {url, type, data, code, error} = options;
    createPayOrder(url, type, data, 2, 4, code, error)
};

const test = () => {
    alert('欢迎使用银钱通');
    console.log('欢迎使用银钱通')
};

const getCreateOrderRequestInfo = (info, channel, platform) => {
    let urlCode = getUrlParam('code');
    const data = {channel, platform, code: urlCode, extra: ''};
    if (typeof info === 'string') {
        return {
            data,
            url: info,
            type: 'POST'
        }
    }

    data.extra = info.extra || '';
    data.code = info.code || urlCode;
    return {
        data,
        url: info.url,
        type: info.type || 'POST'
    }
};

const getQueryOrderRequestInfo = (info, outTradeNo) => {
    const data = {out_trade_no: outTradeNo};
    if (typeof info === 'string') {
        return {
            data,
            url: info,
            type: 'POST'
        }
    }
    return {
        data,
        url: info.url,
        type: info.type || 'POST'
    }
};

const autoPay = (create_order, query_order, options, channel, platform) => {
    const create = getCreateOrderRequestInfo(create_order, channel, platform);

    const onError = options ? options.onError : null;
    const onPaying = options ? options.onPaying : null;
    const onSuccess = options ? options.onSuccess : null;
    const onFinish = options ? options.onFinish : null;

    let outTradeNo;
    let t;

    function queryOrder() {
        const query = getQueryOrderRequestInfo(query_order, outTradeNo);
        $.ajax({
            url: query.url,
            type: query.type,
            data: query.data,
            success: res => {
                clearTimeout(t);
                if (res.code === 200) {
                    onSuccess && onSuccess(outTradeNo, res);
                    return onFinish && onFinish()
                }
                t = setTimeout(function () {
                    queryOrder()
                }, 1000)
            },
            error: () => {
                clearTimeout(t);
                t = setTimeout(function () {
                    queryOrder()
                }, 1000)
            }
        })
    }

    $.ajax({
        url: create.url,
        type: create.type,
        data: create.data,
        success: res => {
            if (res && res.code === 200 && res.data && res.data.out_trade_no) {
                outTradeNo = res.data.out_trade_no;
                onPaying && onPaying(res);

                const executeSuccess = pay(channel, platform, res.data.pay_body);

                if (executeSuccess) {
                    t = setTimeout(function () {
                        queryOrder()
                    }, 1000)
                }
            }
            return onError && onError('创建订单失败')
        },
        error: () => {
            onError && onError('创建订单失败');
            return onFinish && onFinish()
        }
    })
};

const wxpay_mp = (create_order, query_order, options) => {
    autoPay(create_order, query_order, options, 2, 4);
};

const wxpay_h5 = (create_order, query_order, options) => {
    autoPay(create_order, query_order, options, 2, 3);
};

const alipay_h5 = (create_order, query_order, options) => {
    autoPay(create_order, query_order, options, 1, 3);
};

const alipay_pc = (create_order, query_order, options) => {
    autoPay(create_order, query_order, options, 1, 1);
};

export {
    test,
    pay,
    isPaySuccess,

    wxpay_h5,
    wxpay_mp,
    alipay_h5,
    alipay_pc,

    multipleQrCode,
    alipayH5,
    alipayPc,
    wxpayH5,
    wxpayMp,
}