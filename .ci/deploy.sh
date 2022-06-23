#!/bin/sh -e

ACTION=$(aws ecs describe-services --cluster $ECS_CLUSTER_NAME --services $ECS_SERVICE_NAME | jq '.services | length' | xargs -n 1 -P 20 -i sh -c '
if
  [ "{}" -eq 0 ]
then
  echo create
else
  echo update
fi')

# task definition
envsubst < td.template > "./TASKDEF.json"
#cat ./TASKDEF.json
aws ecs register-task-definition --cli-input-json file://TASKDEF.json > REGISTERED_TASKDEF.json
TASKDEFINITION_ARN=$( < REGISTERED_TASKDEF.json jq -r .taskDefinition.taskDefinitionArn )
export TASKDEFINITION_ARN

# service defenition
envsubst < service-$ACTION.json > "./SERVICEDEF.json"
aws ecs $ACTION-service --cli-input-json file://SERVICEDEF.json | tee SERVICE.json
