<?php
/**
 * Recent_Posts widget class with Icon
 *
 * @since 1.0
 */
class fixtech_recent_posts extends WP_Widget {

	function __construct() {
		$widget_ops = array('classname' => 'themetechmount_widget_recent_entries', 'description' => esc_attr__( "Your site&#8217;s most recent Posts.", 'fixtech') );
		parent::__construct('themetechmount-recent-posts', esc_attr__('Fixtech Recent Posts', 'fixtech'), $widget_ops);
		$this->alt_option_name = 'widget_recent_entries';

	}

	function widget($args, $instance) {
		

		if ( ! isset( $args['widget_id'] ) )
			$args['widget_id'] = $this->id;


		//ob_start();
		extract($args);
		
		
		$title = ( ! empty( $instance['title'] ) ) ? $instance['title'] : esc_attr__( 'Recent Posts', 'fixtech' );
		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );
		$number = ( ! empty( $instance['number'] ) ) ? absint( $instance['number'] ) : 3;
		if ( ! $number )
 			$number = 3;
			
		$r = new WP_Query( array(
			'posts_per_page'      => $number,
			'no_found_rows'       => true,
			'post_status'         => 'publish',
			'ignore_sticky_posts' => true
		));
		
		?>
		
		
		<?php
		if ($r->have_posts()) :
?>

		<?php
		echo wp_kses( /* HTML Filter */
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
			echo wp_kses( /* HTML Filter */
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
		
		<ul class="tm-recent-post-list">
		
		<?php
		if ($r->have_posts()){
			
			while ( $r->have_posts() ) :
				$r->the_post();
				echo themetechmount_recent_posts( $r );
			endwhile;
			
		}
		?>
		
		</ul>
		
		
		
		<?php
		echo wp_kses( /* HTML Filter */
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
		$instance['title'] = strip_tags($new_instance['title']);
		$instance['number'] = (int) $new_instance['number'];
	

		$alloptions = wp_cache_get( 'alloptions', 'options' );
		if ( isset($alloptions['widget_recent_entries']) )
			delete_option('widget_recent_entries');

		return $instance;
	}


	function form( $instance ) {
		$title     = isset( $instance['title'] ) ? esc_attr( $instance['title'] ) : '';
		$number    = isset( $instance['number'] ) ? absint( $instance['number'] ) : 5;
	
?>
		<p><label for="<?php echo esc_attr($this->get_field_id( 'title' )); ?>"><?php esc_attr_e( 'Title:', 'fixtech' ); ?></label>
		<input class="widefat" id="<?php echo esc_attr($this->get_field_id( 'title' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'title' )); ?>" type="text" value="<?php echo esc_attr($title); ?>" /></p>

		<p><label for="<?php echo esc_attr($this->get_field_id( 'number' )); ?>"><?php esc_attr_e( 'Number of posts to show:', 'fixtech' ); ?></label>
		<input id="<?php echo esc_attr($this->get_field_id( 'number' )); ?>" name="<?php echo esc_attr($this->get_field_name( 'number' )); ?>" type="text" value="<?php echo esc_attr($number); ?>" size="3" /></p>
		
<?php
	}
}

register_widget('fixtech_recent_posts');