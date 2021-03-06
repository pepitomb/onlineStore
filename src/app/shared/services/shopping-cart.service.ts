import { ProductInCart } from 'shared/models/productInCart';
import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireObject } from '../../../../node_modules/angularfire2/database';
import { Product } from 'shared/models/product';
import { pipe, Observable } from '../../../../node_modules/rxjs';
import { take, map } from '../../../../node_modules/rxjs/operators';
import { ShoppingCart } from 'shared/models/shopping-cart';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {

  constructor(private db: AngularFireDatabase) { }

  private create() {
    return this.db.list('/shopping-carts').push({
      dateCreated: new Date().getTime()
    });
  }

  async getCart(): Promise<Observable<ShoppingCart>>{
    const cartId = await this.getOrCreateCartId();
    console.log('CartId ', cartId);
    return this.db.object<ShoppingCart>('/shopping-carts/' + cartId).valueChanges()
      .pipe(map(x => new ShoppingCart(x.items)));
  }

  async clearCart(){
    const cartId = await this.getOrCreateCartId();
    this.db.object('/shopping-carts/' + cartId + '/items').remove();

  }

  private getItem(cartId: string, productId: string){
    return this.db.object('/shopping-carts/' + cartId + '/items/' + productId);
  }


  // To convert a async method to a sync method
  private async getOrCreateCartId(): Promise<string>{
    const cartId = localStorage.getItem('cartId');

    if (cartId) return cartId;

    const result = await this.create();
    localStorage.setItem('cartId', result.key);
    return result.key;

    // this is replaced for a async call to the asyncronous method
    // this.create().then(result => {
    //   localStorage.setItem('cartId', result.key);
    //   return this.getCart(result.key);
    // });
  }

  async addToCart(product: Product){
    this.updateItemQuantity(product, 1);
  }

  async removeFromCart(product: Product){
    this.updateItemQuantity(product, -1);
  }

  private async updateItemQuantity(product: Product, change: number){
    const cartId = await this.getOrCreateCartId();
    const item$ = this.getItem(cartId, product.key);

    item$.valueChanges().pipe(take(1))
      .subscribe(
        (item: ProductInCart) => {
            const itemQuantity = (item ? item.quantity : 0) + change;

            if(itemQuantity === 0){
              item$.remove();
            }
            else {
              item$.update({product: product, quantity: itemQuantity});
            }
          }
      );
  }
}
