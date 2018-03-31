import $ from 'jquery';
import * as browserStore from 'storejs';
import YouTubePlayer from 'youtube-player';

export default function video(dataset, mode) { 
    var participant_id = browserStore.get('participant_id');
    if(participant_id === undefined) {
        $.ajax({
            method: 'GET',
            url: '/api/participant_id/' + dataset
        }).done((data) => {
            browserStore.set('participant_id', data.participant_id);
            participant_id = data.participant_id;
            storeBrowserInfo(data.participant_id);
        });
    } else {
        dispatch();
    }

    function dispatch(){
        var player1,
            stateNames;

        var id = '';
        var call = '';
        if(mode == 0) {
            id = 'TX3XNsG5eO4';
            call = '/api/ssim_start/' + dataset + '/' + participant_id;
        } else {
            id = '-9ivaZwFj0U';
            call = '/api/deconfusion_start/' + dataset + '/' + participant_id;
        }
        player1 = YouTubePlayer('youtubevideo', {
            height: $(window).height() - 100,
            width: $(window).width() - 100,
            videoId: id,
            playerVars:{
                'rel':0,
                'showinfo':0,
                'autoplay':1,
                'controls':0,
                'disablekb':1,
                'modestbranding':1
            }
        });
        player1.playVideo()
        player1.on('stateChange', function (event) {
            if (event.data === 0) {
                $.ajax({
                    method: 'GET',
                    url: call
                }).done(() => {
                    window.location.href = "confusion.html";
                });
            }
        });
    }
}