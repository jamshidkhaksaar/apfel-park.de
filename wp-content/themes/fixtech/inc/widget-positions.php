<?php

/**
 * Register widget areas.
 *
 * @since Fixtech 1.0
 *
 * @return void
 */
 
 if( !function_exists('themetechmount_fixtech_init_widgets') ){
function themetechmount_fixtech_init_widgets() {
	
	if( !function_exists('themetechmount_fixtech_cs_framework_init') ){
	
		register_sidebar( array(
			'name' => esc_attr__( 'Right Sidebar for Blog', 'fixtech' ),
			'id' => 'sidebar-right-blog',
			'description' => esc_attr__( 'This is right sidebar for blog section', 'fixtech' ),
			'before_widget' => '<aside id="%1$s" class="widget %2$s">',
			'after_widget' => '</aside>',
			'before_title' => '<h3 class="widget-title">',
			'after_title' => '</h3>',
		) );
		
		register_sidebar( array(
			'name' => esc_attr__( 'Right Sidebar for Pages', 'fixtech' ),
			'id' => 'sidebar-right-page',
			'description' => esc_attr__( 'This is right sidebar for pages', 'fixtech' ),
			'before_widget' => '<aside id="%1$s" class="widget %2$s">',
			'after_widget' => '</aside>',
			'before_title' => '<h3 class="widget-title">',
			'after_title' => '</h3>',
		) );
	
	}
}
}
add_action( 'widgets_init', 'themetechmount_fixtech_init_widgets' );