'use strict';


angular.module('deckApp')
  .directive('instanceList', function(clusterFilterService) {
    return {
      restrict: 'E',
      templateUrl: 'scripts/modules/instance/instanceList.html',
      scope: {
        instances: '=',
        sortFilter: '=',
      },
      link: function(scope) {
        scope.updateQueryParams = clusterFilterService.updateQueryParams;
      }
    };
  })
  .directive('instanceListBody', function ($timeout, $filter, $rootScope, $state, scrollTriggerService, clusterFilterService) {
    return {
      restrict: 'C',
      scope: {
        instances: '=',
        sortFilter: '=',
        renderInstancesOnScroll: '=',
      },
      link: function (scope, elem) {
        scope.rendered = false;

        var base = elem.parent().inheritedData('$uiView').state;

        function buildTableRowOpenTag(instance) {
          var activeClass = $state.includes('**.instanceDetails', {instanceId: instance.id, provider: instance.provider }) ? ' info' : ' ';
          return '<tr class="clickable instance-row ' + activeClass + '"' +
            ' data-provider="' + instance.provider + '"' +
            ' data-instance-id="' + instance.id + '">';
        }

        function buildInstanceIdCell(row, instance) {
          var status = instance.healthState;
          row += '<td><span class="glyphicon glyphicon-' + status + '-triangle"></span> ' +
            instance.id + '</td>';
          return row;
        }

        function buildLaunchTimeCell(row, instance) {
          row += '<td>' + $filter('timestamp')(instance.launchTime) + '</td>';
          return row;
        }

        function buildZoneCell(row, instance) {
          row += '<td>' + instance.availabilityZone + '</td>';
          return row;
        }

        function buildDiscoveryCell(row, discoveryStatus) {
          row += '<td class="text-center small">' + discoveryStatus + '</td>';
          return row;
        }

        function buildLoadBalancersCell(row, loadBalancers) {
          row += '<td>';
          loadBalancers.forEach(function (loadBalancer) {
            var tooltip = loadBalancer.state === 'OutOfService' ? loadBalancer.description.replace(/"/g, '&quot;') : null;
            var icon = loadBalancer.state === 'InService' ? 'up' : 'down';
            if (tooltip) {
              row += '<div data-toggle="tooltip" title="' + tooltip + '">';
            } else {
              row += '<div>';
            }
            row += '<span class="glyphicon glyphicon-' + icon + '-triangle"></span> ';
            row += loadBalancer.name;
            row += '</div>';
          });
          if (!loadBalancers.length) {
            row += '-';
          }
          row += '</td>';
          return row;
        }

        function renderInstances() {
          $('[data-toggle="tooltip"]', elem).tooltip('destroy');
          var instances = scope.instances || [],
            filtered = instances.filter(clusterFilterService.shouldShowInstance),
            sorted = $filter('orderBy')(filtered, scope.sortFilter.instanceSort.key);

          elem.get(0).innerHTML = sorted.map(function (instance) {
            var loadBalancers = [],
              discoveryState = '',
              discoveryStatus = '-',
              loadBalancerSort = '';

            instance.health.forEach(function (health) {
              if (health.type === 'LoadBalancer') {
                loadBalancers = health.loadBalancers;
                loadBalancerSort = _(health.loadBalancers)
                  .sortByAll(['name', 'state'])
                  .map(function (lbh) {
                    return lbh.name + ':' + lbh.state;
                  })
                  .join(',');
              }
              if (health.type === 'Discovery') {
                discoveryState = health.state.toLowerCase();
                discoveryStatus = $filter('robotToHuman')(health.status.toLowerCase());
              }
            });

            var row = buildTableRowOpenTag(instance);
            row = buildInstanceIdCell(row, instance);
            row = buildLaunchTimeCell(row, instance);
            row = buildZoneCell(row, instance);
            row = buildDiscoveryCell(row, discoveryStatus);
            row = buildLoadBalancersCell(row, loadBalancers);
            row += '</tr>';

            return row;

          }).join('');

          $('[data-toggle="tooltip"]', elem).tooltip({placement: 'left', container: 'body'});

          scope.$watch('sortFilter.instanceSort.key', function(newVal, oldVal) {
            if (newVal && oldVal && newVal !== oldVal) {
              renderInstances();
            }
          });
        }

        if (scope.renderInstancesOnScroll) {
          scrollTriggerService.register(scope, elem, scope.scrollTarget, renderInstances);
        } else {
          renderInstances();
        }

        scope.$on('$destroy', function() {
          $('[data-toggle="tooltip"]', elem).removeData().tooltip('destroy');
          elem.unbind('click');
        });

        elem.click(function(event) {
          $timeout(function() {
            if (event.target) {
              // anything handled by ui-sref or actual links should be ignored
              if (event.isDefaultPrevented() || (event.originalEvent && (event.originalEvent.defaultPrevented || event.originalEvent.target.href))) {
                return;
              }
              var $targetRow =  $(event.target).closest('tr');
              if (!$targetRow.length) {
                return;
              }
              var targetRow = $targetRow.get(0);
              var params = {
                instanceId: targetRow.getAttribute('data-instance-id'),
                provider: targetRow.getAttribute('data-provider')
              };
              // also stolen from uiSref directive
              $state.go('.instanceDetails', params, {relative: base, inherit: true});
              $('tr.instance-row').removeClass('info');
              targetRow.className += ' info';
              event.preventDefault();
            }
          });
        });

        scope.$on('$destroy', function() {
          $('[data-toggle="tooltip"]', elem).tooltip('destroy');
          elem.unbind('click');
        });

      }
    };
  }
);
