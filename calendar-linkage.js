var $ = require('jq');
var Klass = require('Klass');
var tpl = require('nt').tpl;
var Emitter = require('../libs/emitter');
var _DATE_ = require('../utils/date');


var uid = 0;
/**
 * 日历类
 * @param el
 * @param options
 * @constructor
 */
var Calendar = function (el, options) {
    this.el = el;
    this.settings = options;

    this.form = null;
    this.to = null;

    this.dateForm = null;
    this.dateTo = null;

    this.now = new Date();

    this.body = $('body');

    this.init();

    this.createCalendarWrap();
    this.createCalendar(this.Year, this.Month);
    this.bindHandle();
    this.position();

};

Calendar.prototype.init = function () {
    var _self = this;
    var el = _self.el;
    var settings = _self.settings;

    if (!el.data('Year')) {
        _self.Month = _self.now.getMonth();
        _self.Year = _self.now.getFullYear();
        return _self;
    }

    _self.Month = el.data('Month');
    _self.Year = el.data('Year');

    var val = el.val();
    if (val !== '')
        return _self;

    var date = val.split('-');
    _self.dateForm = _DATE_.dateToJson(date[0], settings.format);
    _self.dateTo = _DATE_.dateToJson(date[1], settings.format);

    _self.form = _DATE_.getDateString(_self.dateForm);

    if (_self.dateTo !== null)
        _self.dateTo = _DATE_.getDateString(_self.dateTo);
};

Calendar.prototype.createCalendarWrap = function () {
    var _self = this;
    _self.uid = uid;
    var html = tpl('calendarTmp', {
        uid: uid
    });
    _self.body.append(html);
    uid++;
};

Calendar.prototype.createCalendar = function (year, month) {
    var _self = this;
    var settings = _self.settings;
    var Y = year;
    var M = month;

    /**
     * 获取模板内容
     * @param index
     * @returns {*}
     */
    function getTable(index) {
        return tpl('calendarTableTmp', {
            calendarCount: settings.calendarCount,
            Y: Y,
            M: M,
            index: index,
            body: getCalBodyHtml()
        })
    }

    function getCalBodyHtml() {
        var vDate = new Date();
        vDate.setDate(1);
        vDate.setMonth(M);
        vDate.setFullYear(Y);

        var vFirstDay = vDate.getDay();
        var vLastDay = _DATE_.getDaysInMonth(Y, M);

        var vDay = 1;
        var vOnLastDay = 0;

        var html = ['<tr style="cursor:hand">'];

        for (var i = 0; i < vFirstDay; i++) {
            html.push("<td class=othermonth>&nbsp;</td>");
        }

        for (var j = vFirstDay; j < 7; j++) {
            html.push('<td class="' + _self.getDayClass(Y, M, vDay) + '" data-btn="day" y=' + Y + ' m=' + M + ' d=' + vDay + '>' + _self.formatDay(Y, M, vDay) + '</td>');
            vDay = vDay + 1;
        }
        html.push('</tr>');

        for (var k = 2; k < 7; k++) {
            html.push('<tr>');
            for (j = 0; j < 7; j++) {
                html.push('<td class="' + _self.getDayClass(Y, M, vDay) + '" data-btn="day" y=' + Y + ' m=' + M + ' d=' + vDay + '>' + _self.formatDay(Y, M, vDay) + '</td>')
                vDay = vDay + 1;
                if (vDay > vLastDay) {
                    vOnLastDay = 1;
                    break;
                }
            }
            if (j == 6)
                html.push('</tr>');

            if (vOnLastDay == 1)
                break;
        }

        // Fill up the rest of last week with proper blanks, so that we get proper square blocks
        for (var m = 1; m < (7 - j); m++) {
            html.push('<td class=othermonth>&nbsp;</td>')
        }

        return html.join('')
    }

    var templateArr = ['<td valign="top" class="ds-prev" data-box="prev">'];
    templateArr.push('<div class="ds-prevyear" data-btn="prevyear">《</div>');
    templateArr.push('<div class="ds-prevmonth" data-btn="prevmonth">《</div>');
    templateArr.push('</td>');

    for (var i = 0; i < settings.calendarCount; i++) {
        templateArr.push(getTable(i));

        M++;
        if (M > 11) {
            M = 0;
            Y++;
        }
    }

    templateArr.push('<td valign="top" class="ds-next">');
    templateArr.push('<div class="ds-nextyear" data-btn="nextyear">》</div>');
    templateArr.push('<div class="ds-nextmonth" data-btn="nextmonth">》</div>');
    templateArr.push('</td>');

    var calendarBox = _self.calendarBox = $('#calendar' + _self.uid + ' [data-box="calendar-tr"]');
    calendarBox.html(templateArr.join(''));

};

Calendar.prototype.getDayClass = function (y, m, d) {
    var _self = this;
    if (_self.to == null) {
        if (_self.form != null && y == _self.dateForm.y && m == _self.dateForm.m && d == _self.dateForm.d) {
            return 'selected';
        }
    }
    var ymd = y + (m < 10 ? '0' + m : m) + (d < 10 ? '0' + d : d);
    if (Number(_self.form) <= Number(ymd) && Number(ymd) <= Number(_self.to)) {
        return 'selected';
    }
    return 'thismonth';
};

Calendar.prototype.formatDay = function (vyear, vmonth, vday) {
    var vNowDay = this.now.getDate();
    var vNowMonth = this.now.getMonth();
    var vNowYear = this.now.getFullYear();
    if (vday == vNowDay && vmonth == vNowMonth && vyear == vNowYear)
        return ("<strong>" + vday + "</strong>");
    return vday;
};

Calendar.prototype.bindHandle = function () {
    var _self = this;

    _self.calendarBox.on('click', '[data-btn="prevyear"]', function () {
        _self.Year--;
        _self.renderContent();
    });
    _self.calendarBox.on('click', '[data-btn="nextyear"]', function () {
        _self.Year++;
        _self.renderContent();
    });

    _self.calendarBox.on('click', '[data-btn="prevmonth"]', function () {
        _self.Month--;

        if (_self.Month < 0) {
            _self.Month = 11;
            _self.Year--;
        }

        _self.renderContent();
    });
    _self.calendarBox.on('click', '[data-btn="nextmonth"]', function () {
        _self.Month++;

        if (_self.Month > 11) {
            _self.Month = 0;
            _self.Year++;
        }

        _self.renderContent();
    });

    var box = _self.calendarBox.parents('.calendar-box');
    box.on('click', '[data-btn="changeDate"]', function () {
        _self.setInputVal();
        box.hide();
    });
    box.on('click', '[data-btn="cancelChangeDate"]', function () {
        box.hide();
    });


    _self.calendarBox.on('click', '[data-btn="day"]', function () {
        var that = $(this);
        if (_self.form == null) {
            _self.dateFrom = {'d': that.attr('d'), 'm': that.attr('m'), 'y': that.attr('y')};
            _self.form = _DATE_.getDateString(_self.dateFrom);
            that.removeClass().addClass('selected');
        } else if (_self.to == null) {
            _self.dateTo = {'d': that.attr('d'), 'm': that.attr('m'), 'y': that.attr('y')};
            _self.to = _DATE_.getDateString(_self.dateTo);
            //change from and to
            if (Number(_self.to) < Number(_self.form)) {
                _self.to = _self.form;
                _self.dateTo = _self.dateFrom;
                _self.dateFrom = {'d': that.attr('d'), 'm': that.attr('m'), 'y': that.attr('y')};
                _self.form = _DATE_.getDateString(_self.dateFrom);
            }
            _self.renderContent();
        } else {
            _self.dateFrom = {'d': that.attr('d'), 'm': that.attr('m'), 'y': that.attr('y')};
            _self.form = _DATE_.getDateString(_self.dateFrom);
            _self.to = null;
            _self.dateTo = null;
            _self.calendarBox.find(".selected").removeClass().addClass('thismonth');
            that.removeClass().addClass('selected');
        }
    });

};

Calendar.prototype.renderContent = function () {
    var _self = this;
    var m = _self.Month;
    var y = _self.Year;

    _self.createCalendar(y, m);

};

Calendar.prototype.setInputVal = function () {
    var _self = this;
    if (_self.form == null)
        return;

    if (Number(_self.form) == Number(_self.to) || _self.to == null) {
        _self.el.val(_DATE_.ymdToStr(_self.dateFrom, _self.settings.format));
    } else {
        _self.el.val(_DATE_.ymdToStr(_self.dateFrom, _self.settings.format) + "-" + _DATE_.ymdToStr(_self.dateTo, _self.settings.format));
    }

    _self.el.data("Year", _self.Year);
    _self.el.data("Month", _self.Month);
};

Calendar.prototype.position = function () {
    var _self = this;
    var el = _self.el;
    var calendarBox = _self.calendarBox.parents('.calendar-box');

    var offset = el.offset();
    var height = el.outerHeight();
    var clientB = (parseInt(document.body.clientHeight) - parseInt(offset.top + height));
    var divH = calendarBox.height();
    calendarBox.show();

    if (clientB <= divH) {
        if (offset.top - divH < 0) {
            return calendarBox.offset({top: 0, left: offset.left});
        }
        return calendarBox.offset({top: offset.top - divH, left: offset.left});
    }
    calendarBox.offset({top: offset.top + height, left: offset.left});
}

/**
 * 接口
 * @param el
 * @param options
 * @returns {*}
 */
module.exports = function (el, options) {
    options = $.extend({}, {
        calendarCount: 2,
        format: 'YYYY-MM-DD'
    }, options);

    el = $(el);


    return el.each(function () {
        return new Calendar($(this), options);
    });
}
