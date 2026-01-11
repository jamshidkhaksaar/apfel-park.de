<?php if ( function_exists('max_mega_menu_is_enabled') && max_mega_menu_is_enabled('themetechmount-main-menu') ) : ?>

	<!-- Max Mega Menu is enabled so we are not showing our toggle menu -->
	
<?php else: ?>

<button id="menu-toggle" class="menu-toggle">
	<span class="tm-hide"><?php esc_attr_e( 'Toggle menu', 'fixtech' ); ?></span><i class="tm-fixtech-icon-bars"></i>
</button>

<?php endif; ?>

<?php wp_nav_menu( array( 'theme_location' => 'themetechmount-main-menu', 'menu_class' => 'nav-menu', 'container_class' => 'nav-menu' ) ); ?>
