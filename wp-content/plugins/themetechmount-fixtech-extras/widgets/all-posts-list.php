<?php
/**
 * All Post List widget class with Icon
 *
 * @since 1.0
 */
class fixtech_all_post_list_widget extends WP_Widget {
	
	
	/**
	 * Sets up the widgets name etc
	 */
	public function __construct() {
		$widget_style = array('classname'   => 'fixtech_all_post_list_widget',
							  'description' => esc_attr__('Show All Post List of current Taxonomy.', 'fixtech') );
		parent::__construct(
			'fixtech_all_post_list_widget', // Base ID
			esc_attr__('Fixtech All Post List Widget', 'fixtech'), // Name
			$widget_style // Args
		);
	}

	
	/**
	 * Outputs the content of the widget
	 *
	 * @param array $args
	 * @param array $instance
	 */
	function widget($args, $cur_instance) {

	if ( ! isset( $args['widget_id'] ) ){
		$args['widget_id'] = $this->id;
	}
	extract($args);
	
	$title			= ( !empty($cur_instance['title']) ) ? $cur_instance['title'] : esc_attr__( 'Posts', 'industco' );
	$title			= apply_filters( 'widget_title', $title, $cur_instance, $this->id_base );
	$number			= ( !empty($cur_instance['number']) ) ? absint( $cur_instance['number'] ) : '-1';
	
	
	$post_type = 'post';
	if( is_singular() ){
		$post_type = get_post_type();
		$post_type = (empty($post_type)) ? 'post' : $post_type ;
	}
	
	
	
	$r = new WP_Query( array(
		'posts_per_page'      => $number,
		'no_found_rows'       => true,
		'post_status'         => 'publish',
		'ignore_sticky_posts' => true,
		'post_type'			  => $post_type,
	));
	
	
	
	?>
	
	
	<?php
	if ($r->have_posts()) :
?>

	<?php
	
	echo wp_kses( /* html Filter */
		$before_widget,
		array(
			'aside' => array(
				'id'    => array(),
				'class' => array(),
			),
			'div' => array(
				'id'    => array(),
				'class' => array(),
			),
			'span' => array(
				'class' => array(),
			),
			'h2' => array(
				'class' => array(),
				'id'    => array(),
			),
			'h3' => array(
				'class' => array(),
				'id'    => array(),
			),
			'h4' => array(
				'class' => array(),
				'id'    => array(),
			),
			
		)
	); 
	?>
	
	
	<?php
	if ( !empty($title) ){
		$recentposts_widget_title = $before_title . $title . $after_title;
		echo wp_kses( /* html Filter */
			$recentposts_widget_title,
			array(
				'aside' => array(
					'id'    => array(),
					'class' => array(),
				),
				'div' => array(
					'id'    => array(),
					'class' => array(),
				),
				'span' => array(
					'class' => array(),
				),
				'h2' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h3' => array(
					'class' => array(),
					'id'    => array(),
				),
				'h4' => array(
					'class' => array(),
					'id'    => array(),
				),
				
			)
		);
	}
	?>
	
	<div class="tm-all-post-list-div">
		<ul class="tm-all-post-list">
		<?php
		
		$current_id = ( is_singular() ) ? get_the_ID() : '' ;
		
		if ($r->have_posts()){
			while ( $r->have_posts() ) :
				$r->the_post();
				$current_class = ( get_the_ID() == $current_id ) ? 'tm-post-active' : '' ;
				?>
				<li class="<?php echo esc_attr($current_class); ?>"><a href="<?php the_permalink(); ?>"> <?php the_title(); ?> </a></li>
				<?php
			endwhile;
		}
		?>
		</ul>
	</div>
	
	
	<?php
	echo wp_kses( /* html Filter */
		$after_widget,
		array(
			'aside' => array(
				'id'    => array(),
				'class' => array(),
			),
			'div' => array(
				'id'    => array(),
				'class' => array(),
			),
			'span' => array(
				'class' => array(),
			),
			'h2' => array(
				'class' => array(),
				'id'    => array(),
			),
			'h3' => array(
				'class' => array(),
				'id'    => array(),
			),
			'h4' => array(
				'class' => array(),
				'id'    => array(),
			),
			
		)
	);
	?>
	
	
<?php
		// Reset the global $the_post as this query will have stomped on it
		wp_reset_postdata();

		endif;
	
	}
	
	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;
		$instance['title']			= esc_attr($new_instance['title']);
		$instance['number']			= (int) $new_instance['number'];
	
		return $instance;
	}

	function form( $instance ) {
		$title			= isset( $instance['title'] ) ? esc_attr( $instance['title'] ) : '';
		$number			= isset( $instance['number'] ) ? absint( $instance['number'] ) : 5;
	
?>
		
		<p><label for="<?php echo esc_attr($this->get_field_id( 'title' )); ?>"><?php esc_attr_e( 'Title:', 'fixtech' ); ?></label>
		<input class="widefat" id="<?php echo esc_attr($this->get_field_id( 'title' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'title' )); ?>" type="text" value="<?php echo esc_attr($title); ?>" /></p>

		<p><label for="<?php echo esc_attr($this->get_field_id( 'number' )); ?>"><?php esc_attr_e( 'Number of posts to show:', 'fixtech' ); ?></label> <br>
		<input id="<?php echo esc_attr($this->get_field_id( 'number' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'number' )); ?>" type="text" value="<?php echo esc_attr($number); ?>" size="3" /></p>
		
<?php
	}

}


register_widget( 'fixtech_all_post_list_widget' );