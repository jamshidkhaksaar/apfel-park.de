<article class="themetechmount-box themetechmount-box-events themetechmount-box-view-top-image-details themetechmount-events-box-view-top-image-details">
	<div class="themetechmount-post-item">
		<div class="themetechmount-post-item-inner">
			<?php echo themetechmount_get_featured_media( get_the_ID(), 'full', true ); ?>		
		</div>	
		<div class="themetechmount-box-bottom-content">
			<div class="themetechmount-box-meta themetechmount-events-meta"><?php echo themetechmount_wp_kses( themetechmount_event_date() ); ?></div>
			<?php echo themetechmount_box_title(); ?>
			<div class="themetechmount-box-desc">
				<?php if( has_excerpt() ){ ?>
				<div class="tm-short-desc">
					<?php $return  = nl2br( get_the_excerpt() );
					echo do_shortcode($return); ?>
				</div>
			<?php } ?>
			</div>
			<?php echo themetechmount_wp_kses( themetechmount_event_venue() ); ?>
			<div class="themetechmount-eventbox-footer">
				<?php echo themetechmount_event_readmore(); ?>
			</div>
		</div>
	</div>
</article>
