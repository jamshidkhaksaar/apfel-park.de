<?php
/**
 * The template for displaying product content within loops
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/content-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you (the theme developer).
 * will need to copy the new files to your theme to maintain compatibility. We try to do this.
 * as little as possible, but it does happen. When this occurs the version of the template file will.
 * be bumped and the readme will list any important changes.
 *
 * @see     http://docs.woothemes.com/document/template-structure/
 * @author  WooThemes
 * @package WooCommerce/Templates
 * @version 3.6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

global $product, $woocommerce_loop;


// Store column count for displaying the grid
$woocommerce_column = themetechmount_get_option('woocommerce-column');

if ( empty( $woocommerce_loop['columns'] ) ) {
	$woocommerce_loop['columns'] = apply_filters( 'loop_shop_columns', $woocommerce_column );
}

// Ensure visibility
if ( ! $product || ! $product->is_visible() ) {
	return;
}


// Extra post classes
$classes = array();
	
switch( $woocommerce_loop['columns'] ){
	case '1':
		//$classes[] = 'col-xs-12 col-sm-12 col-md-12 col-lg-12';
		$classes[] = 'col-sm-12';
		break;
	case '2':
		$classes[] = 'col-xs-12 col-sm-6 col-md-6 col-lg-6';
		break;
	case '3':
	default:
		$classes[] = 'col-xs-12 col-sm-6 col-md-4 col-lg-4';
		break;
	case '4':
		$classes[] = 'col-xs-12 col-sm-6 col-md-3 col-lg-3';
		break;
	
}

// Out of stock message
$out_of_stock_message = '';
if (!$product->is_in_stock()){
	$out_of_stock_message = '<div class="tm-wc-out-of-stock">'. esc_attr__('Out of stock','fixtech') .'</div>';
}

?>
<li <?php post_class( $classes ); ?>>
	<div class="tm-product-box">
		<?php
		
		/**
		 * woocommerce_before_shop_loop_item hook.
		 *
		 * @hooked woocommerce_template_loop_product_link_open - 10
		 */
		do_action( 'woocommerce_before_shop_loop_item' );
		
		
		/**
		 * woocommerce_before_shop_loop_item_title hook.
		 *
		 * @hooked woocommerce_show_product_loop_sale_flash - 10
		 * @hooked woocommerce_template_loop_product_thumbnail - 10
		 */
		do_action( 'woocommerce_before_shop_loop_item_title' );

		
		/**
		 * woocommerce_shop_loop_item_title hook.
		 *
		 * @hooked woocommerce_template_loop_product_title - 10
		 */
		do_action( 'woocommerce_shop_loop_item_title' );

		/**
		 * woocommerce_after_shop_loop_item_title hook.
		 *
		 * @hooked woocommerce_template_loop_rating - 5
		 * @hooked woocommerce_template_loop_price - 10
		 */
		do_action( 'woocommerce_after_shop_loop_item_title' );

		/**
		 * woocommerce_after_shop_loop_item hook.
		 *
		 * @hooked woocommerce_template_loop_product_link_close - 5
		 * @hooked woocommerce_template_loop_add_to_cart - 10
		 */
		do_action( 'woocommerce_after_shop_loop_item' );
		?>
	</div><!-- .productbox -->
</li>
