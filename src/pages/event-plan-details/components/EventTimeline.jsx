import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EventTimeline = ({ timelineData, eventStartTime, onUpdateActivity, onAddActivity, className = '' }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);

  const adjustedTimelineData = React.useMemo(() => {
    if (!eventStartTime || !timelineData || timelineData.length === 0) {
      return timelineData;
    }

    const [eventHour, eventMinute] = eventStartTime.split(':').map(Number);
    const firstActivityTime = timelineData[0]?.startTime;
    if (!firstActivityTime) return timelineData;

    const [firstActivityHour, firstActivityMinute] = firstActivityTime.split(':').map(Number);

    const eventStartMinutes = eventHour * 60 + eventMinute;
    const firstActivityMinutes = firstActivityHour * 60 + firstActivityMinute;
    const timeDifference = eventStartMinutes - firstActivityMinutes;

    if (timeDifference === 0) {
      return timelineData;
    }

    return timelineData.map(item => {
      const [itemHour, itemMinute] = item.startTime.split(':').map(Number);
      const itemMinutes = itemHour * 60 + itemMinute;
      const newMinutes = itemMinutes + timeDifference;

      const newHour = Math.floor(newMinutes / 60) % 24;
      const newMinute = newMinutes % 60;

      return {
        ...item,
        startTime: `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
      };
    });
  }, [timelineData, eventStartTime]);

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded?.has(itemId)) {
      newExpanded?.delete(itemId);
    } else {
      newExpanded?.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'setup': return 'Settings';
      case 'presentation': return 'Presentation';
      case 'break': return 'Coffee';
      case 'networking': return 'Users';
      case 'meal': return 'UtensilsCrossed';
      case 'entertainment': return 'Music';
      case 'cleanup': return 'Trash2';
      default: return 'Clock';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'setup': return 'text-warning';
      case 'presentation': return 'text-primary';
      case 'break': return 'text-accent';
      case 'networking': return 'text-secondary';
      case 'meal': return 'text-success';
      case 'entertainment': return 'text-purple-500';
      case 'cleanup': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime?.split(':')?.map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours?.toString()?.padStart(2, '0')}:${endMins?.toString()?.padStart(2, '0')}`;
  };

  return (
    <div className={`bg-card rounded-lg border border-border shadow-card ${className}`}>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <Icon name="Clock" size={20} className="text-primary" />
              <span>Event Timeline</span>
            </h2>
            {timelineData && timelineData.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {timelineData.length} activities scheduled
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddActivity()}
            iconName="Plus"
            iconPosition="left"
          >
            Add Activity
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {adjustedTimelineData?.map((item, index) => {
              const isExpanded = expandedItems?.has(item?.id);
              const isLast = index === adjustedTimelineData?.length - 1;

              return (
                <div key={item?.id} className="relative flex items-start space-x-4">
                  {/* Timeline Dot */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 border-card bg-card shadow-sm ${getActivityColor(item?.type)}`}>
                    <Icon name={getActivityIcon(item?.type)} size={16} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg p-4 hover:bg-muted/80 transition-smooth">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-foreground">{item?.title}</h3>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {item?.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {item?.startTime} - {calculateEndTime(item?.startTime, item?.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpanded(item?.id)}
                            className="w-6 h-6"
                          >
                            <Icon 
                              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                              size={14} 
                            />
                          </Button>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center space-x-1">
                          <Icon name="Clock" size={14} />
                          <span>{formatDuration(item?.duration)}</span>
                        </div>
                        {item?.location && (
                          <div className="flex items-center space-x-1">
                            <Icon name="MapPin" size={14} />
                            <span>{item?.location}</span>
                          </div>
                        )}
                        {item?.attendees && (
                          <div className="flex items-center space-x-1">
                            <Icon name="Users" size={14} />
                            <span>{item?.attendees} people</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{item?.description}</p>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          {/* Resources */}
                          {item?.resources && item?.resources?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center space-x-1">
                                <Icon name="Package" size={14} />
                                <span>Required Resources</span>
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {item?.resources?.map((resource, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 text-xs bg-card rounded p-2">
                                    <Icon name="Dot" size={12} className="text-primary" />
                                    <span className="text-muted-foreground">{resource}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assigned Team */}
                          {item?.assignedTo && item?.assignedTo?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center space-x-1">
                                <Icon name="UserCheck" size={14} />
                                <span>Assigned Team</span>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {item?.assignedTo?.map((person, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 bg-card rounded-full px-3 py-1 text-xs">
                                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-medium">
                                        {person?.charAt(0)?.toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground">{person}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {item?.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center space-x-1">
                                <Icon name="FileText" size={14} />
                                <span>Notes</span>
                              </h4>
                              <p className="text-xs text-muted-foreground bg-card rounded p-2">
                                {item?.notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(item?.id)}
                              iconName="Edit2"
                              iconPosition="left"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              iconName="Copy"
                              iconPosition="left"
                            >
                              Duplicate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              iconName="Trash2"
                              iconPosition="left"
                              className="text-error hover:text-error"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTimeline;