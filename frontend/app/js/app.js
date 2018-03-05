import trainclass from './trainclass';
import confusionmatrix from './confusionmatrix'
import detailview from './detailview'
import $ from 'jquery'

$(() => {
    var dataset = 'cifar10';
    var location = window.location.href.toString().split(window.location.host)[1];
    
    if (location == '/') {
        confusionmatrix(dataset);
    } else {
        var label = findGetParameter('label');
        var classification = findGetParameter('class');
        trainclass(dataset, label, classification);
        detailview(dataset, label, classification);
    }

    function findGetParameter(parameterName) {
        var result = null,
            tmp = [];
        window.location.search
            .substr(1)
            .split("&")
            .forEach(function(item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    }
});
