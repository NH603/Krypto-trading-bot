import {Component, EventEmitter, Input, Output} from '@angular/core';

import * as Models from './models';

@Component({
  selector: 'market-quoting',
  template: `<div class="tradeSafety2" style="margin-top:-4px;padding-top:0px;padding-right:0px;"><div style="padding-top:0px;padding-right:0px;">
      Market Width: <span class="{{ marketWidth ? \'text-danger\' : \'text-muted\' }}">{{ marketWidth | number:'1.'+product.fixed+'-'+product.fixed }}</span>,
      Quote Width: <span class="{{ ordersWidth ? \'text-danger\' : \'text-muted\' }}">{{ ordersWidth | number:'1.'+product.fixed+'-'+product.fixed }}</span>, Quotes: <span title="New Quotes in memory" class="{{ quotesInMemoryNew ? \'text-danger\' : \'text-muted\' }}">{{ quotesInMemoryNew }}</span>/<span title="Working Quotes in memory" class="{{ quotesInMemoryWorking ? \'text-danger\' : \'text-muted\' }}">{{ quotesInMemoryWorking }}</span>/<span title="Other Quotes in memory" class="{{ quotesInMemoryDone ? \'text-danger\' : \'text-muted\' }}">{{ quotesInMemoryDone }}</span>
      <div style="padding-left:0px;">Wallet TBP: <span class="text-danger">{{ targetBasePosition | number:'1.3-3' }}</span>, pDiv: <span class="text-danger">{{ positionDivergence | number:'1.3-3' }}</span>, APR: <span class="{{ sideAPRSafety!=\'Off\' ? \'text-danger\' : \'text-muted\' }}">{{ sideAPRSafety }}</span></div>
      </div></div><div style="padding-right:4px;padding-left:4px;padding-top:4px;">
      <table class="marketQuoting table table-hover table-responsive text-center">
        <tr class="active">
          <td>bidSize&nbsp;</td>
          <td>bidPrice</td>
          <td>askPrice</td>
          <td>askSize&nbsp;</td>
        </tr>
        <tr class="info">
          <th *ngIf="bidStatus == 'Live'" class="text-danger">{{ qBidSz | number:'1.4-4' }}<span *ngIf="!qBidSz">&nbsp;</span></th>
          <th *ngIf="bidStatus == 'Live'" class="text-danger">{{ qBidPx | number:'1.'+product.fixed+'-'+product.fixed }}</th>
          <th *ngIf="bidStatus != 'Live'" colspan="2" class="text-danger" title="Bids Quote Status">{{ bidStatus }}</th>
          <th *ngIf="askStatus == 'Live'" class="text-danger">{{ qAskPx | number:'1.'+product.fixed+'-'+product.fixed }}</th>
          <th *ngIf="askStatus == 'Live'" class="text-danger">{{ qAskSz | number:'1.4-4' }}<span *ngIf="!qAskSz">&nbsp;</span></th>
          <th *ngIf="askStatus != 'Live'" colspan="2" class="text-danger" title="Ask Quote Status">{{ askStatus }}</th>
        </tr>
      </table>
    <div *ngIf="levels != null" [ngClass]="(a?'a ':'')+'levels'">
      <table class="marketQuoting table table-hover table-responsive text-center" style="width:50%;float:left;">
        <tr *ngIf="a" class="skip">
          <td><div class="text-danger text-center"><br />To <a href="{{ product.advert.homepage }}/blob/master/README.md#unlock" target="_blank">unlock</a> all market levels<br />and to collaborate with the development..<br /><br />make an acceptable Pull Request on github,<br/>or send 0.01210000 BTC or more to:<br /><a href="https://www.blocktrail.com/BTC/address/{{ a }}" target="_blank">{{ a }}</a><br /><br />Wait 0 confirmations and restart this bot. <!-- you can remove this message, but obviously the missing market levels will not be displayed magically. the market levels will be only displayed if the also displayed address is credited with 0.01210000 BTC. Note that if you make a Pull Request i will credit the payment for you easy, just let me know in the description of the PR what is the BTC Address displayed in your bot.--></div></td>
        </tr>
        <tr [ngClass]="orderPriceBids.indexOf(lvl.price)==-1?'active':'success buy'" *ngFor="let lvl of levels.bids; let i = index">
          <td [ngClass]="'bids'+lvl.cssMod">
            <div class="bgSize" [ngStyle]="{'background': getBgSize(lvl, 'bids')}"></div>
            {{ lvl.size | number:'1.4-4' }}
          </td>
          <td [ngClass]="'bids'+(lvl.cssMod==2?2:0)">
            {{ lvl.price | number:'1.'+product.fixed+'-'+product.fixed }}
          </td>
        </tr>
      </table>
      <table class="marketQuoting table table-hover table-responsive text-center" style="width:50%;">
        <tr *ngIf="a" style="height:0px;" class="skip"><td></td></tr>
        <tr [ngClass]="orderPriceAsks.indexOf(lvl.price)==-1?'active':'success sell'" *ngFor="let lvl of levels.asks; let i = index">
          <td [ngClass]="'asks'+(lvl.cssMod==2?2:0)">
            {{ lvl.price | number:'1.'+product.fixed+'-'+product.fixed }}
          </td>
          <td [ngClass]="'asks'+lvl.cssMod">
            <div class="bgSize" [ngStyle]="{'background': getBgSize(lvl, 'asks')}"></div>
            {{ lvl.size | number:'1.4-4' }}
          </td>
        </tr>
      </table>
    </div>
    </div>`
})
export class MarketQuotingComponent {

  public levels: Models.Market = null;
  public allBidsSize: number = 0;
  public allAsksSize: number = 0;
  public dirtyBids: number = 0;
  public dirtyAsks: number = 0;
  public qBidSz: number;
  public qBidPx: number;
  public qAskPx: number;
  public qAskSz: number;
  public orderBids: any[];
  public orderAsks: any[];
  public orderPriceBids: number[] = [];
  public orderPriceAsks: number[] = [];
  public bidStatus: string;
  public askStatus: string;
  public quotesInMemoryNew: number;
  public quotesInMemoryWorking: number;
  public quotesInMemoryDone: number;
  public marketWidth: number;
  public ordersWidth: number;
  public noBidReason: string;
  public noAskReason: string;
  private targetBasePosition: number;
  private positionDivergence: number;
  private sideAPRSafety: string;

  @Input() product: Models.ProductState;

  @Input() a: string;

  @Input() set online(online: boolean) {
    if (online) return;
    this.clearQuote();
  }

  @Output() onBidsLength = new EventEmitter<number>();
  @Output() onAsksLength = new EventEmitter<number>();
  @Output() onMarketWidth = new EventEmitter<number>();

  @Input() set setOrderList(o: any[]) {
    this.updateQuote(o);
  }

  @Input() set setTargetBasePosition(o: Models.TargetBasePositionValue) {
    if (o == null) {
      this.targetBasePosition = null;
      this.sideAPRSafety = null;
      this.positionDivergence = null;
    } else {
      this.targetBasePosition = o.tbp;
      this.sideAPRSafety = o.sideAPR || 'Off';
      this.positionDivergence = o.pDiv;
    }
  }

  @Input() set setQuoteStatus(o) {
    if (o == null) {
      this.bidStatus = Models.QuoteStatus[1];
      this.askStatus = Models.QuoteStatus[1];
      this.quotesInMemoryNew = 0;
      this.quotesInMemoryWorking = 0;
      this.quotesInMemoryDone = 0;
    } else {
      this.bidStatus = Models.QuoteStatus[o.bidStatus];
      this.askStatus = Models.QuoteStatus[o.askStatus];
      this.quotesInMemoryNew = o.quotesInMemoryNew;
      this.quotesInMemoryWorking = o.quotesInMemoryWorking;
      this.quotesInMemoryDone = o.quotesInMemoryDone;
    }
  }

  private clearQuote = () => {
    this.orderBids = [];
    this.orderAsks = [];
  }

  private getBgSize = (lvl: Models.MarketSide, side: string) => {
    var allSize: string = side=='bids'?'allBidsSize':'allAsksSize';
    var red: string = side=='bids'?'141':'255';
    var green: string = side=='bids'?'226':'142';
    var blue: string = side=='bids'?'255':'140';
    var dir: string = side=='bids'?'left':'right';
    return 'linear-gradient(to '+dir+', rgba('+red+', '+green+', '+blue+', 0.69) '
      + Math.ceil(lvl.size/this[allSize]*100)
      + '%, rgba('+red+', '+green+', '+blue+', 0) 0%)';
  }

  private incrementMarketData = (diff: Models.MarketSide[], side: string) => {
    var allSize: string = side=='bids'?'allBidsSize':'allAsksSize';
    var dirtySize: string = side=='bids'?'dirtyBids':'dirtyAsks';
    for (var i: number = 0; i < diff.length; i++) {
      var found = false;;
      for (var j: number = 0; j < this.levels[side].length; j++)
        if (diff[i].price === this.levels[side][j].price) {
          found = true;
          this[allSize] -= this.levels[side][j].size;
          if (diff[i].size) {
            this.levels[side][j].size = diff[i].size;
            this.levels[side][j].cssMod = 1;
            this[allSize] += this.levels[side][j].size;
          } else {
            this.levels[side][j].cssMod = 2;
            this[dirtySize]++;
          }
          break;
        }
      if (!found && diff[i].size) {
        for (var j: number = 0; j < this.levels[side].length; j++)
          if (this.levels[side][j].cssMod != 2 && (side == 'bids'
            ? diff[i].price > this.levels[side][j].price
            : diff[i].price < this.levels[side][j].price)
          ) {
            found = true;
            this[allSize] += diff[i].size;
            this.levels[side].splice(j, 0, diff[i]);
            this.levels[side][j].cssMod = 1;
            break;
          }
        if (!found) {
          this[allSize] += diff[i].size;
          this.levels[side].push(diff[i]);
          this.levels[side][this.levels[side].length - 1].cssMod = 1;
        }
      }
    }
  };

  @Input() set setMarketData(update: Models.Market) {
    if (update == null || typeof (<any>update).diff != 'boolean') {
      this.allBidsSize = 0;
      this.allAsksSize = 0;
      if (update != null) {
        for (var i: number = 0; i < update.bids.length; i++)
          this.allBidsSize += update.bids[i].size;
        for (var i: number = 0; i < update.asks.length; i++)
          this.allAsksSize += update.asks[i].size;
      }
      this.levels = update;
    } else {
      if (this.levels == null) return;
      for (var i = this.levels.bids.length - 1; i >= 0; i--)
        if (this.levels.bids[i].cssMod)
          if (this.levels.bids[i].cssMod==2)
            this.levels.bids.splice(i, 1);
          else this.levels.bids[i].cssMod = 0;
      for (var i = this.levels.asks.length - 1; i >= 0; i--)
        if (this.levels.asks[i].cssMod)
          if (this.levels.asks[i].cssMod==2)
            this.levels.asks.splice(i, 1);
          else this.levels.asks[i].cssMod = 0;
      // if (document.body.className != 'visible')
      this.dirtyBids = 0;
      this.dirtyAsks = 0;
      this.incrementMarketData(update.bids, 'bids');
      this.incrementMarketData(update.asks, 'asks');
      if (this.levels == null) {
        this.onBidsLength.emit(0);
        this.onAsksLength.emit(0);
        this.marketWidth = 0;
      } else {
        this.onBidsLength.emit(this.levels.bids.length - this.dirtyBids);
        this.onAsksLength.emit(this.levels.asks.length - this.dirtyAsks);
        this.marketWidth = this.levels.asks[0].price - this.levels.bids[0].price;
      }
      this.onMarketWidth.emit(this.marketWidth);
    }
  }

  private updateQuote = (o) => {
    if (!o || (typeof o.length == 'number' && !o.length)) {
      this.clearQuote();
      return;
    } else if (typeof o.length == 'number' && typeof o[0] == 'object') {
      this.clearQuote();
      return o.forEach(x => setTimeout(this.updateQuote(x), 0));
    }

    const orderSide = o.side === Models.Side.Bid ? 'orderBids' : 'orderAsks';
    const orderPrice = o.side === Models.Side.Bid ? 'orderPriceBids' : 'orderPriceAsks';
    if (o.orderStatus == Models.OrderStatus.Cancelled
      || o.orderStatus == Models.OrderStatus.Complete
    ) this[orderSide] = this[orderSide].filter(x => x.orderId !== o.orderId);
    else if (!this[orderSide].filter(x => x.orderId === o.orderId).length)
      this[orderSide].push({
        orderId: o.orderId,
        side: o.side,
        price: o.price,
        quantity: o.quantity,
      });
    this[orderPrice] = this[orderSide].map((a)=>a.price);

    if (this.orderBids.length) {
      var bid = this.orderBids.reduce((a,b)=>a.price>b.price?a:b);
      this.qBidPx = bid.price;
      this.qBidSz = bid.quantity;
    } else {
      this.qBidPx = null;
      this.qBidSz = null;
    }
    if (this.orderAsks.length) {
      var ask = this.orderAsks.reduce((a,b)=>a.price<b.price?a:b);
      this.qAskPx = ask.price;
      this.qAskSz = ask.quantity;
    } else {
      this.qAskPx = null;
      this.qAskSz = null;
    }

    this.ordersWidth = Math.max((this.qAskPx && this.qBidPx) ? this.qAskPx - this.qBidPx : 0, 0);
  }
}
