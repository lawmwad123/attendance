"""Add Casbin tables for RBAC + ABAC

Revision ID: add_casbin_tables
Revises: fe213c3e6f48
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_casbin_tables'
down_revision = 'fe213c3e6f48'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create casbin_rule table for Casbin policies
    op.create_table(
        'casbin_rule',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ptype', sa.String(length=10), nullable=True),
        sa.Column('v0', sa.String(length=256), nullable=True),
        sa.Column('v1', sa.String(length=256), nullable=True),
        sa.Column('v2', sa.String(length=256), nullable=True),
        sa.Column('v3', sa.String(length=256), nullable=True),
        sa.Column('v4', sa.String(length=256), nullable=True),
        sa.Column('v5', sa.String(length=256), nullable=True),
        sa.Column('v6', sa.String(length=256), nullable=True),
        sa.Column('v7', sa.String(length=256), nullable=True),
        sa.Column('v8', sa.String(length=256), nullable=True),
        sa.Column('v9', sa.String(length=256), nullable=True),
        sa.Column('v10', sa.String(length=256), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for better performance
    op.create_index('idx_casbin_rule_ptype', 'casbin_rule', ['ptype'])
    op.create_index('idx_casbin_rule_v0', 'casbin_rule', ['v0'])
    op.create_index('idx_casbin_rule_v1', 'casbin_rule', ['v1'])
    op.create_index('idx_casbin_rule_v2', 'casbin_rule', ['v2'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_casbin_rule_v2', table_name='casbin_rule')
    op.drop_index('idx_casbin_rule_v1', table_name='casbin_rule')
    op.drop_index('idx_casbin_rule_v0', table_name='casbin_rule')
    op.drop_index('idx_casbin_rule_ptype', table_name='casbin_rule')
    
    # Drop table
    op.drop_table('casbin_rule')
